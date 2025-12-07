# app/crud/expenses.py
from typing import List
from datetime import date
from schemas import ExpenseCreate, ExpenseOut

def create_expense(conn, e: ExpenseCreate) -> ExpenseOut:
    """
    INSERT INTO expenses (project_name, payer_id, title, amount, participant_ids, spent_at)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    spent_at = e.spent_at or date.today()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO expenses
                (project_name, payer_id, title, amount, participant_ids, spent_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, project_name, payer_id, title, amount, participant_ids, spent_at
            """,
            (e.project_name, e.payer_id, e.title, e.amount, e.participant_ids, spent_at)
        )
        row = cur.fetchone()
    return ExpenseOut(
        id=row[0],
        project_name=row[1],
        payer_id=row[2],
        title=row[3],
        amount=float(row[4]),
        participant_ids=row[5],
        spent_at=row[6],
    )

def list_expenses_by_project(conn, project_name: str) -> List[ExpenseOut]:
    """
    SELECT * FROM expenses
    WHERE project_name = %s
    ORDER BY spent_at DESC, id DESC
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM expenses
            WHERE project_name = %s
            ORDER BY spent_at DESC, id DESC
            """,
            (project_name,)
        )
        rows = cur.fetchall()
    return [
        ExpenseOut(
            id=r[0],
            project_name=r[1],
            payer_id=r[2],
            title=r[3],
            amount=float(r[4]),
            participant_ids=r[5],
            spent_at=r[6],
        )
        for r in rows
    ]

def delete_expense(conn, expense_id: int) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))

def list_projects(conn) -> list[str]:
    """
    虚拟“项目列表”：从账目表里查 DISTINCT project_name
    SELECT DISTINCT project_name FROM expenses ORDER BY project_name;
    """
    with conn.cursor() as cur:
        cur.execute("SELECT DISTINCT project_name FROM expenses ORDER BY project_name")
        rows = cur.fetchall()
    return [r[0] for r in rows]

def list_participants_for_project(conn, project_name: str) -> list[str]:
    """
    从所有账目里收集参与过的用户 id
    """
    with conn.cursor() as cur:
        cur.execute(
            "SELECT DISTINCT UNNEST(participant_ids) FROM expenses WHERE project_name = %s",
            (project_name,)
        )
        rows = cur.fetchall()
    return [r[0] for r in rows]
