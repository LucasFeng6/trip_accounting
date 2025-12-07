# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import users, expenses


app = FastAPI(title="Trip Accounting API")

# 前端如果用 python -m http.server 在 8000 端口跑，
# 而 API 在 8001 端口跑，就需要允许来自 8000 的跨域访问
origins = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 注册路由
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(expenses.router, prefix="/expenses", tags=["expenses"])


@app.get("/")
def read_root():
    return {"message": "Trip Accounting API is running"}
