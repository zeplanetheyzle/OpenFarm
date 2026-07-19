🌿 OpenFarm Frontend

## 기술 스택
분류기술프레임워크Next.js 15 (App Router)언어TypeScript스타일Tailwind CSS그래프rechartsPDFhtml2canvas + jsPDF배포Vercel
---

## 파일 구조
```
frontend/
├── app/
│   ├── layout.tsx              # 전역 레이아웃 (Navbar 포함)
│   ├── page.tsx                # 메인 페이지
│   ├── introduction/
│   │   └── page.tsx            # 서비스 소개 · 시스템 흐름
│   ├── dataset/
│   │   └── page.tsx            # 수집형 데이터셋 목록 (작물 카드)
│   ├── crop/
│   │   └── [id]/page.tsx       # 작물별 그래프 · 테이블 · CSV
│   ├── monitor/
│   │   └── page.tsx            # 실시간 제어 모니터링
│   ├── mysmartfarm/
│   │   └── page.tsx            # 내 스마트팜 등록 · 관리
│   ├── mypage/
│   │   └── page.tsx            # Setting (선호도 통계 · 레이아웃)
│   ├── login/
│   │   └── page.tsx            # 로그인
│   └── signup/
│       └── page.tsx            # 회원가입
│
├── components/
│   ├── Navbar.tsx              # 전역 네비게이션 바
│   ├── AIReport.tsx            # AI Growth Report + PDF 다운로드
│   ├── CropSelection.tsx       # 수집형 팜 카드 선택
│   ├── GraphChart.tsx          # 환경값 Line 그래프
│   ├── DataTable.tsx           # 센서 데이터 테이블
│   ├── DownloadButton.tsx      # CSV 다운로드
│   └── PreferencePieChart.tsx  # 클릭 통계 파이차트
│
├── public/
│   └── images/                 # 작물 이미지 (lettuce.jpg 등)
│
├── .env.local                  # 환경 변수
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
---

## 환경 변수
.env.local 파일을 생성하고 아래 내용을 입력하세요.
```
envNEXT_PUBLIC_API_URL=http://localhost:8000
```
배포 시 Vercel 환경 변수에도 동일하게 설정합니다.
---

## 실행 방법

```
cd frontend
npm install
npm run dev

→ http://localhost:3000 에서 실행
```
---

## 페이지 설명

### /introduction

서비스 소개, 핵심 기능 카드(클릭 시 상세 설명), 시스템 흐름도(수집형/제어형 연결 구조) 표시

### /dataset

수집형 스마트팜에서 수집된 작물별 데이터 카드 목록. 작물 클릭 시 해당 device 목록 표시

### /crop/[id]

작물별 센서 데이터 시각화.


GRAPH 섹션: 온도·습도·CO₂ Line 차트
TABLE 섹션: 페이지네이션 테이블
CSV 다운로드 · Device Status 확인
클릭 수 기반 GRAPH/TABLE 순서 자동 정렬 (선호도 API 연동)


### /monitor

로그인 필요. 제어형 스마트팜 실시간 모니터링.

현재 상태 (온도·습도·CO₂·잎 면적)
추천 상태 (KNN k=5 결과)
현재 제어 상태 (현재값 vs 추천값 비교)
성장 단계 판별
잎 면적 변화 · 환경값 변화 · KNN 추천값 변화 그래프
시간대별 제어 기록 표
브라우저 알림 (🚨 danger / ⚠️ warning)
AI Growth Report 팝업 · PDF 다운로드


### /mysmartfarm

등록된 스마트팜 목록 · 팜 카드 선택
현재 상태 카드 (온도·습도·CO₂·잎 면적)
제어 목록 타임라인
"상세 모니터링 보기" → /monitor 이동


### /mypage

My SmartFarm: 팜 등록 · 삭제
Setting:

이용 통계 파이차트 (graph_click vs table_click)
최근 본 작물 목록 (localStorage)
레이아웃 설정 (커스텀 순서 / 자동 추천)

### /login · /signup

이메일/비밀번호 인증
엔터 키 로그인 지원
이메일 중복 체크 (회원가입)
---

## 주요 컴포넌트

### AIReport.tsx
AI Growth Report 팝업 컴포넌트.
Prop타입설명dataSensorData현재 센서 데이터controlHistoryControlLog[]제어 이력farmInfoFarmInfo | null팜 정보onClose() => void닫기 콜백

포함 섹션: 팜 정보 · 현재 상태 · 추천 상태 · 현재 제어 상태 · 성장 단계 · 잎 면적 그래프 · KNN 추천값 그래프 · 시간대별 제어 기록

PDF 저장: html2canvas로 섹션별 캡처 → jsPDF A4 출력

### 선호도 기반 레이아웃

/crop/[id] 페이지에서 그래프와 테이블 순서는 클릭 수에 따라 자동 결정됩니다.

table_click > graph_click  →  TABLE이 상단
graph_click >= table_click →  GRAPH가 상단

클릭 시 /click/graph 또는 /click/table API 호출
페이지 진입 시 /preference?email=... API로 순서 조회
