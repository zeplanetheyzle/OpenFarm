import os
import glob
import cv2
import numpy as np
import pandas as pd
import re
from ultralytics import YOLO
from sklearn.neighbors import NearestNeighbors
import matplotlib.pyplot as plt
from supabase import create_client, Client

URL = "https://heygnkqtjrpvumjenozr.supabase.co"      
KEY = "sb_publishable_Ruo628BB_Ysc32ts7b250g_T0GkNoZR" 

supabase: Client = create_client(URL, KEY)

print("Supabase에서 센서 데이터를 안전하게 가져오는 중...")
response = supabase.table("sensor_logs").select("*").order("created_at", desc=False).execute()
df = pd.DataFrame(response.data)
print(f"총 {len(df)}줄의 센서 데이터를 성공적으로 동기화했습니다!")

model = YOLO(r'C:\Users\justi\OneDrive\Desktop\비쥬얼스튜디오코드\고프DB\최종결과물\best.pt') # 직접 구축한 상추 데이터셋으로 학습시킨 YOLOv8 모델 불러오기
folder_path = r'C:\Users\justi\OneDrive\Desktop\비쥬얼스튜디오코드\고프DB\최종결과물\plant_images'

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

image_files = sorted(glob.glob(os.path.join(folder_path, '**/*.jpg'), recursive=True), key=natural_sort_key)

areas = []
print(f"\n로컬 폴더에서 {len(image_files)}장의 사진을 발견했습니다. AI 분석 시작...")
for img_path in image_files:
    results = model(img_path, verbose=False)
    total_area = 0
    for result in results:
        if result.masks is not None:
            # YOLOv8 모델을 사용해 이미지 내 식물의 픽셀 면적 추출
            for mask_xy in result.masks.xy:
                points = np.array(mask_xy, dtype=np.int32)
                h, w = result.orig_img.shape[:2]
                mask = np.zeros((h, w), dtype=np.uint8)
                cv2.fillPoly(mask, [points], 255)
                total_area += np.sum(mask == 255)
    areas.append(total_area)

df['created_at_dt'] = pd.to_datetime(df['created_at'])

# DB 속 데이터와 이미지 간의 시차 9시간 보정
if df['created_at_dt'].dt.tz is None:
    df['created_at_dt'] = df['created_at_dt'] + pd.Timedelta(hours=9)
else:
    df['created_at_dt'] = df['created_at_dt'].dt.tz_convert('Asia/Seoul')

df['match_key'] = df.apply(
    lambda row: f"openfarm{row['device_id']}_{row['created_at_dt'].month}.{row['created_at_dt'].day}.{row['created_at_dt'].hour}" 
    if str(row['device_id']).isdigit() 
    else f"{row['device_id']}_{row['created_at_dt'].month}.{row['created_at_dt'].day}.{row['created_at_dt'].hour}", 
    axis=1
)

photo_area_map = {}
for img_path, area in zip(image_files, areas):
    filename = os.path.basename(img_path)       
    match_key = os.path.splitext(filename)[0]   
    photo_area_map[match_key] = area

# DB속 데이터와 이미지 픽셀 데이터를 병합
df['current_area'] = df['match_key'].map(photo_area_map)
final_db = df.dropna(subset=['current_area']).reset_index(drop=True)
print(f"9시간 시차 보정 및 파일 매칭 완료! ({len(final_db)}개 데이터 결합)")

final_db['temperature'] = np.where(final_db['temperature'].between(15, 40), final_db['temperature'], 23.0)
final_db['temperature2'] = np.where(final_db['temperature2'].between(15, 40), final_db['temperature2'], 23.0)

# 두 온도를 합해서 평균을 구한 온도 컬럼 생성
final_db['merged_temp'] = (final_db['temperature'] + final_db['temperature2']) / 2.0

# 습도와 CO2 오류 데이터 삭제 
final_db = final_db[
    (final_db['humidity'].between(0, 100)) &
    (final_db['co2_level'].between(300, 2000))
].reset_index(drop=True)

# 성장률과 24시간 이동 평균 계산
shift_steps = 24 
final_db['past_area'] = final_db.groupby('device_id')['current_area'].transform(lambda x: x.shift(shift_steps))
final_db['growth_rate'] = ((final_db['current_area'] - final_db['past_area']) / final_db['past_area']) * 100
final_db['avg_temp'] = final_db.groupby('device_id')['merged_temp'].transform(lambda x: x.rolling(window=shift_steps).mean())
final_db['avg_hum'] = final_db.groupby('device_id')['humidity'].transform(lambda x: x.rolling(window=shift_steps).mean())
final_db['avg_co2'] = final_db.groupby('device_id')['co2_level'].transform(lambda x: x.rolling(window=shift_steps).mean())

final_db = final_db.dropna(subset=['growth_rate']).reset_index(drop=True)

# KNN 알고리즘을 활용해 유사한 성장 상태를 가진 과거 사례 탐색 모델 빌드
knn = NearestNeighbors(n_neighbors=5)
X = final_db[['current_area']].values
knn.fit(X)

print("\n" + "="*50)
print("실시간 상추 분석 및 환경 추천 시스템")
print("="*50)

new_image_path = r'C:\Users\justi\OneDrive\Desktop\비쥬얼스튜디오코드\고프DB\최종결과물\openfarm1_5.20.22.jpg' # 입력으로 사용할 상추 이미지

if os.path.exists(new_image_path):
    new_results = model(new_image_path, verbose=False)
    new_area = 0
    for result in new_results:
        if result.masks is not None:
            for mask_xy in result.masks.xy:
                points = np.array(mask_xy, dtype=np.int32)
                h, w = result.orig_img.shape[:2]
                mask = np.zeros((h, w), dtype=np.uint8)
                cv2.fillPoly(mask, [points], 255)
                new_area += np.sum(mask == 255)
                
    print(f" 방금 찍은 상추 면적: {new_area} px\n")
    
    if new_area > 0 and len(final_db) > 5:
        # KNN으로 가장 크기가 비슷한 5개의 이웃 찾기
        distances, indices = knn.kneighbors([[new_area]])
        similar_cases = final_db.iloc[indices[0]]
        
        # 가장 근접한 5개의 이웃 상세 정보 출력
        print(" 면적이 가장 비슷한 과거 이웃 5개")
        for i in range(5):
            neighbor = similar_cases.iloc[i]
            dist = distances[0][i] 
            time_str = neighbor['created_at_dt'].strftime('%Y-%m-%d %H:%M')
            print(f"  {i+1}위: [팜 {neighbor['device_id']} | {time_str}] 면적 {neighbor['current_area']}px (차이: {dist:.1f}px) - 성장률: {neighbor['growth_rate']:.2f}%")

        # 5개 중 성장률이 가장 높았던 이웃 도출
        best_case = similar_cases.loc[similar_cases['growth_rate'].idxmax()]
        print("-" * 50)
        print(f" 5개의 이웃 중 가장 높은 성장률: {best_case['growth_rate']:.2f}%")
        print(f" [최적의 환경 세팅] 온도: {best_case['avg_temp']:.1f}°C | 습도: {best_case['avg_hum']:.1f}% | CO2: {best_case['avg_co2']:.0f}ppm")
        print("-" * 50)
        
        # 상추 추출 이미지 띄우기 
        for r in new_results:
            annotated_img = r.plot()
            cv2.imshow("AI Lettuce Detection", annotated_img)
            print("모니터에 분석 창이 떴습니다. 끄려면 이미지 창에서 아무 키나 누르세요.")
            cv2.waitKey(0)
            cv2.destroyAllWindows()
else:
    print(" 지정한 경로에 테스트 사진이 없습니다! 사진 이름이나 경로를 확인해 주세요.")
