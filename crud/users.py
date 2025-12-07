from typing import List
from schemas import UserCreate, UserOut

def create_user(conn, user: UserCreate) -> UserOut:
    """
    INSERT INTO users ...
    返回新用户 id, name
    """
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO users (name) VALUES (%s) RETURNING id, name",
            (user.name,)
        )
        row = cur.fetchone()
    return UserOut(id=row[0], name=row[1])

def list_users(conn) -> List[UserOut]:
    """
    SELECT id, name FROM users ORDER BY id;
    """
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM users ORDER BY id")
        rows = cur.fetchall()
    return [UserOut(id=r[0], name=r[1]) for r in rows]

def get_users_by_ids(conn, ids: list[int]) -> dict[int, str]:
    #用于结算时把 id 映射成 name
    if not ids:
        return {}
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, name FROM users WHERE id = ANY(%s)",
            (ids,)
        )
        rows = cur.fetchall()
    return {r[0]: r[1] for r in rows}
