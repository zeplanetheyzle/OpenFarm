from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#preference 관련 API router 불러오기
from .routes.preference import router as preference_router
#sensor 데이터 관련 API router 불러오기
from .routes.sensor import router as sensor_router
from app.routes import click
from app.routes import device_status
from app.routes import recommendation
from app.routes import auth
from app.routes import preference_status
from app.routes import control
from app.routes import smartfarm

#FastAPI앱 생성
app = FastAPI()

#Frontend와 Backend 연결_gpt사용
app.add_middleware(
    CORSMiddleware,
    #모든 주소 허용
    allow_origins=["*"],
    allow_credentials=True,
    #모든 HTTP 메서드 허용
    allow_methods=["*"],
    #모든 헤더 허용
    allow_headers=["*"],
)

#preference router 등록
app.include_router(preference_router)
#sensor router 등록
app.include_router(sensor_router)

#기본 API 주소("/")
@app.get("/")
def root():

    return {
        "message": "OpenFarm API"
    }
app.include_router(
    device_status.router
)

app.include_router(
    recommendation.router
)

app.include_router(
    auth.router
)

app.include_router(
    click.router 
)

app.include_router(
    preference_status.router
)

app.include_router(control.router)

app.include_router(smartfarm.router)
