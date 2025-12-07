from typing import List
from schemas import ExpenseOut, SettlementResult, UserBalance, Transfer

def compute_settlement(project_name: str, expenses: List[ExpenseOut],id_to_name: dict[int, str]) -> SettlementResult:
    # 1. total
    # 2. 找到所有参与者：distinct payer_name
    # 3. per_capita = total / 人数
    # 4. 统计每个 payer_name 的 paid、balance
    # 5. 贪心生成转账列表
    if not expenses:
        return SettlementResult(
            project_name=project_name,
            total_amount=0.0,
            per_capita=0.0,
            balances=[],
            transfers=[]
        )

    # 1) 统计所有 user_id
    user_ids: set[int] = set()
    for e in expenses:
        user_ids.add(e.payer_id)
        user_ids.update(e.participant_ids)

    # 2) 计算总金额 & 每人 share_total
    total_amount = sum(e.amount for e in expenses)
    # 这里 per_capita 可以定义为“全项目总额 / 参与过的总人数”
    per_capita = total_amount / len(user_ids) if user_ids else 0.0

    paid_total = {uid: 0.0 for uid in user_ids}
    share_total = {uid: 0.0 for uid in user_ids}

    for e in expenses:
        n = len(e.participant_ids)
        if n == 0:
            continue
        share = e.amount / n
        # payer 付了全额
        paid_total[e.payer_id] += e.amount
        # 每个参与者摊 share
        for uid in e.participant_ids:
            share_total[uid] += share

    balances = []
    for uid in sorted(user_ids):
        bal = paid_total[uid] - share_total[uid]
        balances.append(
            UserBalance(
                user_id=uid,
                user_name=id_to_name.get(uid, f"User{uid}"),
                balance=round(bal, 2)
            )
        )

    # 3) 转账建议（简单贪心）
    receivers = [b for b in balances if b.balance > 0]
    payers    = [b for b in balances if b.balance < 0]

    receivers.sort(key=lambda x: x.balance, reverse=True)
    payers.sort(key=lambda x: x.balance)  # 最负在前

    transfers: List[Transfer] = []

    i, j = 0, 0
    while i < len(payers) and j < len(receivers):
        payer = payers[i]
        recv = receivers[j]
        need  = recv.balance
        owe   = -payer.balance
        amt = round(min(need, owe), 2)
        if amt > 0:
            transfers.append(
                Transfer(
                    from_user=payer.user_name,
                    to_user=recv.user_name,
                    amount=amt
                )
            )
            payer.balance += amt
            recv.balance  -= amt

        if abs(payer.balance) < 1e-6:
            i += 1
        if recv.balance < 1e-6:
            j += 1

    return SettlementResult(
        project_name=project_name,
        total_amount=round(total_amount, 2),
        per_capita=round(per_capita, 2),
        balances=balances,
        transfers=transfers
    )
