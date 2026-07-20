# 🤖 AI Agent 
> OpenFarm 플랫폼에서 동작하는 AI Agent의 구조, 역할, 데이터 흐름을 정의합니다.
> 

---

## Agent 개요

OpenFarm은 **5개의 Agent**가 유기적으로 연결되어 스마트팜 환경을 자동 최적화합니다.

```
[수집 Agent] → [분석 Agent] → [추천 Agent] → [제어 Agent]
                                    ↓
                             [모니터링 Agent] ← 사용자
```

---

## Agent 1 — 수집 Agent

**역할**: 수집형 스마트팜의 환경 데이터를 수집하여 DB에 저장

**실행 위치**: Raspberry Pi (수집형 스마트팜)

**실행 파일**: `main.cpp`

### 입력

| 소스 | 데이터 |
| --- | --- |
| Arduino (SHT4x) | 온도 1, 온도 2 (°C) |
| Arduino (SHT4x) | 습도 (%) |
| Arduino (MH-Z19) | CO₂ (ppm) |
| Camera | 식물 이미지 (JPEG) |

### 출력

- **저장 위치**: `sensor_logs` (hey DB)
- **저장 주기**: 30분
- **전송 방식**: HTTP POST → Supabase REST API

### 동작 흐름

```
1. UART Serial로 Arduino 데이터 수신 (9600bps)
2. 카메라 이미지 캡처 (OpenCV)
3. 이미지 Supabase Storage 업로드
4. sensor_logs INSERT
   { device_id, temperature, temperature2, humidity, co2_level, image_url, crop_type }
```

### 환경 변수

```bash
DEVICE_ID=openfarm1
CROP_TYPE=상추
SERIAL_PORT=/dev/ttyS0
SUPABASE_KEY=sb_...
```

---

## Agent 2 — 분석 Agent

**역할**: 식물 이미지에서 잎 면적을 계산하고 성장 데이터를 정제

**실행 파일**: `최적데이터산출.py`

### 입력

| 소스 | 데이터 |
| --- | --- |
| sensor_logs (hey DB) | 식물 이미지 URL |
| sensor_logs (hey DB) | 온도·습도·CO₂ |

### 출력

- **저장 위치**: `model_data` (qom DB)
- **주요 컬럼**: `plant_area`, `avg_temp`, `avg_hum`, `growth_rate`

### 동작 흐름

```
1. sensor_logs에서 이미지 URL SELECT
2. YOLOv8 (best.pt)로 잎 영역 감지
3. 픽셀 면적 (plant_area, px²) 산출
4. 성장률 (growth_rate) 계산
5. model_data INSERT
```

### 성장 단계 판별

```python
if plant_area < 3000:    stage = "정식기 (초기)"
elif plant_area < 8000:  stage = "생육기 (중기)"
else:                    stage = "수확기 (후기)"
```

---

## Agent 3 — 추천 Agent

**역할**: KNN 알고리즘으로 현재 식물에 최적화된 환경값을 추론

**실행 파일**: `최적데이터산출.py`

### 입력

| 소스 | 데이터 |
| --- | --- |
| model_data (qom DB) | plant_area (현재 잎 면적) |
| model_data (qom DB) | 과거 성장 사례 (학습 데이터) |

### 출력

- **저장 위치**: `recommend_logs` (qom DB)
- **주요 컬럼**: `recommended_temp`, `recommended_hum`

### KNN 동작 흐름

```
1. model_data에서 현재 plant_area와 유사한 k=5 사례 SELECT
2. 유사도 기준: Euclidean Distance (잎 면적 차이 최소화)
3. k=5 사례 중 growth_rate 최고 사례의 환경값 선택
4. recommend_logs INSERT
   { device_id, temperature, humidity, co2_level, plant_area,
     recommended_temp, recommended_hum, created_at }
```

### KNN 파라미터

| 파라미터 | 값 | 설명 |
| --- | --- | --- |
| k | 5 | 유사 사례 수 |
| 거리 함수 | Euclidean | plant_area 기반 |
| 선택 기준 | growth_rate 최대 | 성장률 최고 사례 |

---

## Agent 4 — 제어 Agent

**역할**: 추천값을 수신하여 실제 환경 장치를 자동 제어

**실행 위치**: Raspberry Pi (제어형 스마트팜)

### 입력

| 소스 | 데이터 |
| --- | --- |
| recommend_logs (qom DB) | recommended_temp, recommended_hum |
| 자체 센서 | 현재 온도·습도·CO₂ |

### 제어 장치 및 동작 조건

| 장치 | 동작 조건 |
| --- | --- |
| 펠티어소자 (냉각) | 현재 온도 > 추천 온도 + 1°C |
| 열선 (가열) | 현재 온도 < 추천 온도 − 1°C |
| 가습기 | 현재 습도 < 추천 습도 − 5% |
| 환풍구 (환기·제습) | CO₂ > 1000ppm 또는 습도 과다 |

### 제어 로직

```python
def get_action(current, recommended):
    actions = []
    if current.temp > recommended.temp + 1:
        actions.append("펠티어소자 가동 (냉각)")
    elif current.temp < recommended.temp - 1:
        actions.append("열선 가동 (가열)")
    if current.hum < recommended.hum - 5:
        actions.append("가습 필요")
    elif current.hum > recommended.hum + 5:
        actions.append("환풍구 개방 (제습)")
    if current.co2 > 1000:
        actions.append("환풍구 개방 (CO₂ 조절)")
    return actions if actions else ["정상 범위 유지"]
```

- **제어 주기**: 1시간마다 recommend_logs SELECT
- **기기 식별**: DEVICE_ID 환경변수

---

## Agent 5 — 모니터링 Agent (웹)

**역할**: 사용자에게 실시간 데이터·추천값·제어 상태를 시각화하고 알림 제공

**실행 위치**: Frontend (Next.js) + Backend (FastAPI)

### 제공 기능

| 기능 | 설명 |
| --- | --- |
| 실시간 현황 | 온도·습도·CO₂·잎 면적 카드 |
| 추천 상태 | KNN 추천값 vs 현재값 비교 |
| 제어 상태 | 현재 작동 중인 장치 표시 |
| 성장 단계 | plant_area 기반 정식기/생육기/수확기 |
| 그래프 | 잎 면적 변화, 환경값 변화, KNN 추천값 변화 |
| 알림 | 🚨 danger / ⚠️ warning |
| AI 리포트 | PDF 자동 생성 (html2canvas + jsPDF) |

### 알림 기준

```
🚨 danger  (즉각 조치): 온도 과다 (>25°C), CO₂ 과다 (>1000ppm)
⚠️ warning (주의):     온도 낮음 (<18°C), 습도 과다 (>70%), 습도 부족 (<50%)
```

---

## 전체 데이터 흐름

```
수집 Agent              분석 Agent       추천 Agent        제어 Agent
    │                       │                │                 │
    ▼                       │                │                 │
sensor_logs  ──────────────▶ model_data ───▶ recommend_logs ──▶ 환경 제어
(수집형 DB)              (사용자,선호도 DB)        (제어형 DB)
    │                                           │
    └───────────────────────────────────────────┤
                                                ▼
                                          Backend API
                                          (FastAPI)
                                                │
                                                ▼
                                          Frontend
                                        (모니터링 Agent)
                                                │
                                                ▼
                                             사용자
```

---

## Agent 간 통신 프로토콜

| 구간 | 프로토콜 | 형식 |
| --- | --- | --- |
| Arduino → Raspberry Pi | UART Serial (9600bps) | CSV 텍스트 |
| Raspberry Pi → Supabase | HTTPS (HTTP POST) | JSON |
| 분석·추천 Agent → Supabase | Supabase Python SDK | SQL |
| Backend ↔︎ Supabase | postgrest-py | SQL |
| Frontend ↔︎ Backend | HTTPS (REST API) | JSON |
| Frontend → 사용자 | 브라우저 Notification API | 텍스트 |

---

## 데이터 플라이휠

```
사용자 증가
    → 수집형 팜 운용 기간 증가
    → sensor_logs 데이터 누적
    → model_data 학습 사례 증가
    → KNN k=5 탐색 정확도 향상
    → 더 정밀한 환경 제어
    → 작물 생산성 향상
    → 사용자 증가 (반복)
```
