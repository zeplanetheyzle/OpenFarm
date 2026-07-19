# 🌿 OpenFarm — AI 기반 스마트팜 플랫폼

> 수집형 스마트팜 데이터를 기반으로 KNN 알고리즘이 최적 환경을 추천하고,  
> 제어형 스마트팜의 온습도를 자동 조절하는 AI Agent 플랫폼

---

## 📌 프로젝트 소개

OpenFarm은 두 가지 스마트팜 구조를 연결하는 AI 농업 플랫폼입니다.

- **수집형 스마트팜** — 아두이노 센서와 라즈베리파이 카메라로 온도·습도·CO₂·식물 이미지를 수집
- **제어형 스마트팜** — KNN이 추천한 최적 환경값을 기반으로 펠티어소자·열선·환풍구를 자동 제어

사용자가 플랫폼을 이용할수록 데이터가 쌓이고 AI 추천 정확도가 향상되는 **데이터 플라이휠 구조**를 갖추고 있습니다.

---

## 🗂 파일 구조

```
OpenFarm/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI 앱 + 라우터 등록
│   │   ├── supabase_client.py       # hey DB 연결
│   │   ├── preference_supabase.py   # phr DB 연결
│   │   ├── control_supabase.py      # qom DB 연결
│   │   └── routes/
│   │       ├── sensor.py            # 수집형 센서 데이터 API
│   │       ├── control.py           # 제어형 데이터 API
│   │       ├── auth.py              # 로그인/회원가입
│   │       ├── preference.py        # 사용자 선호도 조회
│   │       ├── preference_status.py # 선호도 통계 + 레이아웃 저장
│   │       ├── smartfarm.py         # 스마트팜 등록/조회/삭제
│   │       ├── recommendation.py    # 규칙 기반 환경 추천
│   │       ├── device_status.py     # 기기 상태 조회
│   │       └── click.py             # 클릭 통계 기록
|   ├── raspberrypi/
|   |    └── main.cpp
|   |
|   ├── Arduino/
|   |    ├──  OpenFarm_Collection.ino
│   │       └──OpenFarm_Control.ino
|   ├── Procfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx               # 전역 Navbar 적용
│   │   ├── page.tsx                 # 메인 페이지
│   │   ├── introduction/page.tsx    # 서비스 소개
│   │   ├── dataset/page.tsx         # 수집형 데이터셋 목록
│   │   ├── crop/[id]/page.tsx       # 작물별 그래프/테이블
│   │   ├── monitor/page.tsx         # 제어형 실시간 모니터링
│   │   ├── mysmartfarm/page.tsx     # 내 스마트팜 등록/관리
│   │   ├── mypage/page.tsx          # 설정 (선호도/레이아웃)
│   │   ├── login/page.tsx           # 로그인
│   │   └── signup/page.tsx          # 회원가입
│   ├── components/
│   │   ├── Navbar.tsx               # 전역 네비게이션
│   │   ├── AIReport.tsx             # AI 리포트 + PDF 다운로드
│   │   ├── CropSelection.tsx        # 수집형 팜 카드 선택
│   │   ├── GraphChart.tsx           # 환경값 그래프
│   │   ├── DataTable.tsx            # 센서 데이터 테이블
│   │   ├── DownloadButton.tsx       # CSV 다운로드
│   │   └── PreferencePieChart.tsx   # 클릭 통계 파이차트
│   ├── public/
│   │   └── images/
|   |
|   ├──.gitignore
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── model_test/                        # AI Model
│   ├── best.pt                        # YOLO Weight
│   ├── DB연동코드.cpp                  # Arduino DB Upload
│   └── 최적데이터추출.py               # Data Processing
│
├── README.md
├── LICENSE
└── .gitignore

```

---

## 🗄 DB 구조

### 수집형 스마트팜 데이터용 DB
| 테이블 | 주요 컬럼 |
|--------|-----------|
| `sensor_logs` | id, created_at, device_id, temperature, temperature2, humidity, co2_level, image_url, crop_type |

- device_id: `openfarm1` (형남공학관 5층 과방), `openfarm2` (창신관 3층)

### 사용자 관리용 DB
| 테이블 | 주요 컬럼 |
|--------|-----------|
| `users` | id, email, password |
| `user_preference` | id, email, graph_click, report_click, table_click, pin_mode, first_section, second_section |
| `smartfarms` | id, user_email, device_id, location, crop_type, size, created_at |

### 제어형 스마트팜 데이터용 DB
| 테이블 | 주요 컬럼 |
|--------|-----------|
| `model_data` | id, created_at, device_id, humidity, co2_level, temperature, plant_area |
| `recommend_logs` | id, created_at, device_id, temperature, humidity, co2_level, plant_area, recommended_temp, recommended_hum |

### DB 연결 흐름
```
users.email
    ↓
smartfarms.user_email → device_id
                                ↓
                    recommend_logs.device_id, model_data.device_id
```

---

## ⚙️ 핵심 기능 + 파일

### 📡 실시간 데이터 수집 및 열람
- 아두이노 센서(SHT4x, MH-Z19)와 라즈베리파이 카메라로 온습도·CO₂·식물 이미지 자동 수집
- 그래프(recharts) + 테이블 + CSV 다운로드
- 관련 파일: `sensor.py`, `crop/[id]/page.tsx`, `GraphChart.tsx`, `DataTable.tsx`

### 🤖 KNN AI 환경 추천
- YOLO로 잎 면적 계산 → KNN(k=5)으로 유사 사례 탐색 → 성장률 최고 사례 환경 추천
- 관련 파일: `최적데이터산출.py`, `recommendation.py`

### 🖥️ 실시간 모니터링
- 등록된 제어형 팜의 현재 상태·추천값·성장 단계 실시간 확인
- 잎 면적 변화 그래프 + KNN 추천값 변화 그래프
- 관련 파일: `monitor/page.tsx`, `control.py`

### ⚙️ 자동 환경 제어
- KNN 추천값 기반으로 펠티어소자(냉각)·열선(가열)·환풍구(환기) 자동 제어
- 관련 파일: `control.py`, `monitor/page.tsx`

### 📊 AI Growth Report
- 현재 상태·추천값·성장 단계·제어 기록을 포함한 PDF 리포트 자동 생성
- 관련 파일: `AIReport.tsx`

### 🔔 이상 감지 알림
- 온습도·CO₂가 허용 범위 벗어나면 🚨(즉각 조치) / ⚠️(주의) 브라우저 알림
- 관련 파일: `monitor/page.tsx`

### 🌱 데이터 플라이휠
- 사용자 이용 → 데이터 축적 → AI 추천 정확도 향상의 선순환 구조
- 관련 파일: `preference.py`, `mypage/page.tsx`

### ⭐ 사용자 선호도
- 그래프·테이블 클릭 수 분석 → 맞춤형 레이아웃 자동 정렬
- 최근 본 수집형 데이터 목록 제공
- 관련 파일: `preference.py`, `preference_status.py`, `mypage/page.tsx`
---

## 🚀 실행 방법

### 환경 변수 설정

**`backend/.env`**
```
SUPABASE_URL=https://hey...
SUPABASE_KEY=...
PREFERENCE_SUPABASE_URL=https://phr...
PREFERENCE_SUPABASE_KEY=...
CONTROL_SUPABASE_URL=https://qom...
CONTROL_SUPABASE_KEY=...
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Backend 실행

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload
```

→ `http://localhost:8000` 에서 실행  
→ `http://localhost:8000/docs` 에서 API 문서 확인

---

### Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

→ `http://localhost:3000` 에서 실행

---

### 라즈베리파이 device_id 설정

```bash
export DEVICE_ID=your_device_id
./main
```

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, recharts |
| Backend | FastAPI, Python |
| Database | Supabase (PostgreSQL) × 3 |
| AI/ML | KNN (scikit-learn), YOLOv8 |
| Hardware | Arduino, Raspberry Pi |
| PDF | html2canvas, jsPDF |
