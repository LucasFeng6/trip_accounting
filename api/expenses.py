from fastapi import APIRouter, Depends
from db_init import get_conn
from schemas import UserOut,ExpenseCreate, ExpenseOut, SettlementResult
from crud import expenses as crud_expenses, users as crud_users
from utils.settlement_logic import compute_settlement

router = APIRouter()

@router.get("/projects", response_model=list[str])
def list_projects(conn=Depends(get_conn)):
    return crud_expenses.list_projects(conn)

@router.post("/", response_model=ExpenseOut)
def create_expense(expense: ExpenseCreate, conn=Depends(get_conn)):
    return crud_expenses.create_expense(conn, expense)

@router.get("/by-project/{project_name}", response_model=list[ExpenseOut])
def list_expenses(project_name: str, conn=Depends(get_conn)):
    return crud_expenses.list_expenses_by_project(conn, project_name)

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, conn=Depends(get_conn)):
    crud_expenses.delete_expense(conn, expense_id)
    return {"status": "ok"}

@router.get("/settlement/{project_name}", response_model=SettlementResult)
def settle_project(project_name: str, conn=Depends(get_conn)):
    expenses = crud_expenses.list_expenses_by_project(conn, project_name)
    # 收集所有涉及到的 user_id，查 name
    user_ids = set()
    for e in expenses:
        user_ids.add(e.payer_id)
        user_ids.update(e.participant_ids)
    id_to_name = crud_users.get_users_by_ids(conn, list(user_ids))
    return compute_settlement(project_name, expenses, id_to_name)

@router.get("/participants/{project_name}", response_model=list[UserOut])
def list_project_participants(project_name: str, conn=Depends(get_conn)):
    # 1. 拿到参与过这个项目的用户 id 列表
    user_ids = crud_expenses.list_participants_for_project(conn, project_name)
    # 2. 查这些用户的 name
    id_to_name = crud_users.get_users_by_ids(conn, user_ids)
    return [
        UserOut(id=uid, name=id_to_name[uid])
        for uid in user_ids if uid in id_to_name
    ]
