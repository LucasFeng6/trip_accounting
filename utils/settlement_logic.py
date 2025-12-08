from typing import List
from schemas import ExpenseOut, SettlementResult, UserBalance, Transfer


def compute_settlement(
    project_name: str,
    expenses: List[ExpenseOut],
    id_to_name: dict[int, str],
) -> SettlementResult:
    """
    对给定项目的一组账目进行结算：
    - 每一笔消费只在「实际参与该笔消费的人」之间均摊；
    - paid_total: 每人实际支付总额；
    - share_total: 每人应该分摊的总额；
    - balance = paid_total - share_total，正数表示该收，负数表示该付。
    """
    if not expenses:
        return SettlementResult(
            project_name=project_name,
            total_amount=0.0,
            per_capita=0.0,
            balances=[],
            transfers=[]
        )

    # 1) 统计所有涉及到的 user_id（付款人 + 所有参与者）
    user_ids: set[int] = set()
    for e in expenses:
        user_ids.add(e.payer_id)
        user_ids.update(e.participant_ids)

    total_amount = sum(e.amount for e in expenses)
    # 这里 per_capita 仅作参考：项目总额 / 涉及的总人数
    per_capita = total_amount / len(user_ids) if user_ids else 0.0

    paid_total = {uid: 0.0 for uid in user_ids}
    share_total = {uid: 0.0 for uid in user_ids}

    # 2) 逐笔账目分摊：只在本笔消费的参与者之间均摊
    for e in expenses:
        # 参与者 = 前端勾选的 participant_ids ∪ 付款人
        participants = set(e.participant_ids)
        participants.add(e.payer_id)

        n = len(participants)
        if n == 0:
            continue

        share = e.amount / n

        # 付款人支付了整笔消费
        paid_total[e.payer_id] += e.amount

        # 每个参与者（含付款人）按份额分摊
        for uid in participants:
            share_total[uid] += share

    # 3) 计算每个人的余额
    balances: List[UserBalance] = []
    for uid in sorted(user_ids):
        bal = paid_total[uid] - share_total[uid]
        balances.append(
            UserBalance(
                user_id=uid,
                user_name=id_to_name.get(uid, f"User{uid}"),
                balance=round(bal, 2),
            )
        )

    # 4) 生成转账建议（简单贪心）
    # 注意：不能直接修改 balances 里的 balance，否则前端看到的余额会被“抹平”为 0
    # 这里使用独立的临时结构保存剩余应收/应付金额
    receivers = [
        {"user_name": b.user_name, "remaining": b.balance}
        for b in balances
        if b.balance > 0
    ]
    payers = [
        {"user_name": b.user_name, "remaining": -b.balance}
        for b in balances
        if b.balance < 0
    ]

    # 收款方：按应收金额从大到小排；付款方：按应付金额从大到小排
    receivers.sort(key=lambda x: x["remaining"], reverse=True)
    payers.sort(key=lambda x: x["remaining"], reverse=True)

    transfers: List[Transfer] = []

    i, j = 0, 0
    while i < len(payers) and j < len(receivers):
        payer = payers[i]
        recv = receivers[j]
        need = recv["remaining"]
        owe = payer["remaining"]
        amt = round(min(need, owe), 2)

        if amt > 0:
            transfers.append(
                Transfer(
                    from_user=payer["user_name"],
                    to_user=recv["user_name"],
                    amount=amt,
                )
            )
            payer["remaining"] -= amt
            recv["remaining"] -= amt

        if payer["remaining"] < 1e-6:
            i += 1
        if recv["remaining"] < 1e-6:
            j += 1

    return SettlementResult(
        project_name=project_name,
        total_amount=round(total_amount, 2),
        per_capita=round(per_capita, 2),
        balances=balances,
        transfers=transfers,
    )
