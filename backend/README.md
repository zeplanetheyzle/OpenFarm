# 🌿 OpenFarm Backend

## 기술 스택

| 분류 | 기술 |
| --- | --- |
| 프레임워크 | FastAPI (Python 3) |
| DB 클라이언트 | Supabase Python SDK (postgrest-py) |
| AI 추론 | KNN (k=5), YOLOv8 |
| 배포 | Railway (Railpack) |
| 통신 | HTTPS, UART Serial, HTTP POST |

---

## 파일 구조

```
backend/
├── app/
│   ├── main.py                  # FastAPI 앱 진입점, 라우터 등록
│   ├── supabase_client.py       # 수집형 데이터용 DB 
│   ├── preference_supabase.py   # 사용자·선호도용 DB 
│   ├── control_supabase.py      # 제어형 데이터용 DB
│   │
│   └── routes/
│       ├── sensor.py            # 수집형 센서 데이터 조회
│       ├── control.py           # 제어형 데이터 조회 (recommend_logs)
│       ├── auth.py              # 사용자 로그인·회원가입
│       ├── smartfarm.py         # 스마트팜 등록·조회·삭제
│       ├── preference.py        # 선호도 순서 계산 (클릭 수 기반)
│       ├── preference_status.py # 선호도 통계 조회
│       ├── recommendation.py    # 규칙 기반 환경 추천
│       ├── device_status.py     # 기기 상태 조회
│       └── click.py             # 그래프·테이블 클릭 이벤트 기록
├── Arduino/
│       ├── OpenFarm_Collection.ino  # 수집형 스마트팜 센서데이터용
│       └── OpenFarm_Control.ino     # 제어형 스마트팜 데이터용
|
├── rasberrypi/
|       └── main.cpp             # 아두이노 센서 수신 및 식물 이미지 캡처 후 Supabase에 저장
│
├── Procfile                     # Railway 배포 명령
└── requirements.txt             # 패키지 목록
```

---

## API 엔드포인트

### Sensor API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/sensor-logs/{crop_type}` | 작물별 수집형 데이터 전체 조회 |
| GET | `/latest?device_id=` | 특정 기기 최신 센서값 조회 |
| GET | `/devices` | 등록된 device_id 목록 조회 |

### Control API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/control/latest?device_id=` | 최신 제어형 데이터 조회 |
| GET | `/control/history?device_id=` | 제어 이력 전체 조회 |

### Auth API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/login` | 이메일·비밀번호 로그인 |
| POST | `/signup` | 회원가입 (이메일 중복 체크 포함) |

### SmartFarm API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/smartfarms?email=` | 사용자 팜 목록 조회 |
| POST | `/smartfarms` | 팜 등록 |
| DELETE | `/smartfarms/{id}` | 팜 삭제 |

### Preference API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/preference?email=` | 클릭 수 기반 선호도 순서 반환 |
| GET | `/preference-stats?email=` | 그래프·테이블 클릭 통계 조회 |
| POST | `/save-layout` | 커스텀 레이아웃 순서 저장 |

### Click API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | `/click/graph` | 그래프 클릭 이벤트 기록 |
| POST | `/click/table` | 테이블 클릭 이벤트 기록 |

### Recommend & Device API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/recommendation/{device_id}` | 규칙 기반 환경 추천 |
| GET | `/device-status/{device_id}` | 기기 온라인 상태 조회 |

---

## DB 연결 구조

```
backend/app/
├── supabase_client.py       →  sensor_logs
├── preference_supabase.py   →  users, user_preference, smartfarms
└── control_supabase.py      →  model_data, recommend_logs
```

### 수집형 데이터

```python
# supabase_client.py
from supabase import create_client
hey_client = create_client(HEY_URL, HEY_KEY)
```

**테이블**: `sensor_logs`
| 컬럼 | 타입 | 설명 |
|——|——|——|
| device_id | text | 기기 식별자 (openfarm1, openfarm2) |
| temperature | float | 온도 1 (SHT4x) |
| temperature2 | float | 온도 2 |
| humidity | float | 습도 (%) |
| co2_level | float | CO₂ (ppm) |
| image_url | text | 식물 이미지 URL |
| crop_type | text | 작물 종류 |
| created_at | timestamp | 수집 시각 |

### 사용자·선호도

```python
# preference_supabase.py
phr_client = create_client(PHR_URL, PHR_KEY)
```

**테이블**: `users`, `user_preference`, `smartfarms`
| 테이블 | 주요 컬럼 |
|——–|———-|
| users | email, password |
| user_preference | email, graph_click, table_click, first_section, second_section |
| smartfarms | email, device_id, farm_name, location, crop_type |

### 제어형 데이터

```python
# control_supabase.py
qom_client = create_client(QOM_URL, QOM_KEY)
```

**테이블**: `model_data`, `recommend_logs`
| 테이블 | 주요 컬럼 |
|——–|———-|
| model_data | plant_area, avg_temp, avg_hum, growth_rate |
| recommend_logs | device_id, temperature, humidity, co2_level, plant_area, recommended_temp, recommended_hum, created_at |

---

## 환경 변수

`.env` 파일 또는 Railway 환경 변수에 설정

```
# hey DB (수집형)
HEY_SUPABASE_URL=https://xxxx.supabase.co
HEY_SUPABASE_KEY=eyJhbGci...

# phr DB (사용자)
PHR_SUPABASE_URL=https://xxxx.supabase.co
PHR_SUPABASE_KEY=eyJhbGci...

# qom DB (제어형)
QOM_SUPABASE_URL=https://xxxx.supabase.co
QOM_SUPABASE_KEY=eyJhbGci...
```

---

## 실행 방법

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

→ `http://localhost:8000` 에서 실행

→ `http://localhost:8000/docs` 에서 Swagger UI 확인

---

## 선호도 순서 계산 로직

`preference.py`에서 subprocess/C++ 없이 Python으로 처리

```python
def get_recommended_order(graph_click, table_click):
    if table_click > graph_click:
        return ["table", "graph"]
    else:
        return ["graph", "table"]
```

- 클릭 수가 같으면 기본 순서 (graph 우선) 반환
- 커스텀 레이아웃 설정 시 `save-layout` API로 덮어씀
