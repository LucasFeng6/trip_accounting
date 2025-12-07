# db_init.py
import psycopg
from psycopg import OperationalError
from typing import Generator


# 这里写死参数，后面你也可以改成从环境变量读
DB_CONFIG = {
    "host": "localhost",
    "port": "5432",
    "dbname": "trip_accounting",
    "user": "postgres",
    "password": "2333",
    "client_encoding": "utf8",
}


def connect_to_database():
    """
    建立一条到 PostgreSQL 的连接并返回。
    调用者负责在用完后关闭连接。
    """
    try:
        connection = psycopg.connect(**DB_CONFIG)
        return connection
    except OperationalError as e:
        print(f"数据库连接失败: {e}")
        return None


def get_conn() -> Generator:
    """
    FastAPI 依赖注入使用的数据库连接生成器：
    在每个请求开始时创建连接，请求结束后自动关闭。
    
    在路由中用法：
        from fastapi import Depends
        from db_init import get_db

        @router.get("/xxx")
        def handler(conn = Depends(get_db)):
            ...
    """
    conn = connect_to_database()
    if conn is None:
        # 这里用 RuntimeError，路由中如果没特殊处理会返回 500
        raise RuntimeError("数据库连接失败")
    try:
        yield conn
        conn.commit()   # 正常提交
    except Exception:
        conn.rollback() # 出错回滚
        raise
    finally:
        conn.close()

