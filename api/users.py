from fastapi import APIRouter, Depends
from db_init import get_conn
from schemas import UserCreate, UserOut
from crud import users as crud_users

router = APIRouter()

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, conn=Depends(get_conn)):
    return crud_users.create_user(conn, user)

@router.get("/", response_model=list[UserOut])
def list_users(conn=Depends(get_conn)):
    return crud_users.list_users(conn)
