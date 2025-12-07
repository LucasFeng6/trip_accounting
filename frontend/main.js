const API_BASE = "http://127.0.0.1:8001"; // FastAPI 地址

let currentUser = null;     // {id, name}
let currentProjectName = null; // 当前项目名（字符串）
let usersCache = [];           // 缓存所有用户

/* ---------- 初始化 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  bindEventHandlers();
  loadUsers();
});

function bindEventHandlers() {
  // 用户相关
  document.getElementById("btn-refresh-users").onclick = loadUsers;
  document.getElementById("btn-create-user").onclick = createUser;
  document.getElementById("user-select").onchange = onUserSelected;

  // 项目相关
  document.getElementById("btn-refresh-projects").onclick = loadProjects;
  document.getElementById("project-select").onchange = onProjectSelected;
  document.getElementById("btn-use-project-name").onclick = useNewProjectName;

  // 操作按钮
  document.getElementById("btn-show-add-expense").onclick = () => showPanel("add-expense");
  document.getElementById("btn-show-expenses").onclick = () => { showPanel("list"); loadExpenses(); };
  document.getElementById("btn-delete-expense").onclick = () => { showPanel("delete"); loadExpenses(); };
  document.getElementById("btn-settle").onclick = () => {doSettlement();};

  // 账目相关
  document.getElementById("btn-submit-expense").onclick = createExpense;
  document.getElementById("btn-confirm-delete").onclick = deleteExpense;
}

/* ---------- 工具函数 ---------- */
function showPanel(which) {
  document.getElementById("add-expense-panel").classList.add("hidden");
  document.getElementById("expenses-list-panel").classList.add("hidden");
  document.getElementById("delete-expense-panel").classList.add("hidden");
  document.getElementById("settlement-panel").classList.add("hidden");

  if (which === "add-expense") {
    document.getElementById("add-expense-panel").classList.remove("hidden");
  } else if (which === "list") {
    document.getElementById("expenses-list-panel").classList.remove("hidden");
  } else if (which === "delete") {
    document.getElementById("delete-expense-panel").classList.remove("hidden");
  } else if (which === "settlement") {
    document.getElementById("settlement-panel").classList.remove("hidden");
  }
}

function findUserNameById(id) {
  const u = usersCache.find((x) => x.id === id);
  return u ? u.name : `User${id}`;
}

/* ---------- 用户 ---------- */
async function loadUsers() {
  const res = await fetch(`${API_BASE}/users`);
  const users = await res.json();
  usersCache = users;

  // Step1 用户选择
  const userSel = document.getElementById("user-select");
  userSel.innerHTML = "";
  users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    userSel.appendChild(opt);
  });

  // 新增账目 - 付款人
  const payerSel = document.getElementById("expense-payer-select");
  payerSel.innerHTML = "";
  users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    payerSel.appendChild(opt);
  });

  // 新增账目 - 参与者多选
  const partSel = document.getElementById("expense-participants-select");
  partSel.innerHTML = "";
  users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    partSel.appendChild(opt);
  });
}


async function createUser() {
  const nameInput = document.getElementById("new-user-name");
  const name = nameInput.value.trim();
  if (!name) return;
  await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name })
  });
  nameInput.value = "";
  loadUsers();
}

function onUserSelected() {
  const sel = document.getElementById("user-select");
  const id = parseInt(sel.value);
  const name = sel.options[sel.selectedIndex].textContent;
  currentUser = { id, name };

  document.getElementById("current-user-name").textContent = name;
  document.getElementById("op-current-user").textContent = name;

  // 默认将 “新增账目” 的付款人设为当前用户
  const payerSel = document.getElementById("expense-payer-select");
  payerSel.value = String(id);

  // 显示项目区域 & 加载项目
  document.getElementById("project-section").classList.remove("hidden");
  loadProjects();
}

/* ---------- 项目 ---------- */
async function loadProjects() {
  const res = await fetch(`${API_BASE}/expenses/projects`);
  const projects = await res.json(); // List[str]
  const sel = document.getElementById("project-select");
  sel.innerHTML = "";
  projects.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
}

function onProjectSelected() {
  const sel = document.getElementById("project-select");
  const name = sel.value;
  if (!name) return;
  currentProjectName = name;
  document.getElementById("op-current-project").textContent = name;
  document.getElementById("operations-section").classList.remove("hidden");
}

function useNewProjectName() {
  const nameInput = document.getElementById("new-project-name");
  const name = nameInput.value.trim();
  if (!name) return;
  currentProjectName = name;
  document.getElementById("op-current-project").textContent = name;
  document.getElementById("operations-section").classList.remove("hidden");
}

/* ---------- 账目 ---------- */
async function createExpense() {
  if (!currentProjectName) {
    alert("请先选择或创建项目");
    return;
  }
  const title = document.getElementById("expense-title").value.trim();
  const amountStr = document.getElementById("expense-amount").value;
  const dateStr = document.getElementById("expense-date").value;
  const payerId = parseInt(document.getElementById("expense-payer-select").value);

  const partSel = document.getElementById("expense-participants-select");
  const participant_ids = Array.from(partSel.selectedOptions).map(o => parseInt(o.value));

  if (!title || !amountStr || participant_ids.length === 0) {
    alert("请填写账目名、金额并至少选择一位参与用户");
    return;
  }

  const body = {
    project_name: currentProjectName,
    payer_id: payerId,
    title: title,
    amount: parseFloat(amountStr),
    participant_ids: participant_ids,
    spent_at: dateStr || null
  };

  const res = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    alert("保存失败");
    return;
  }
  // 清理表单 & 刷新账目列表
  document.getElementById("expense-title").value = "";
  document.getElementById("expense-amount").value = "";
  document.getElementById("expense-date").value = "";
  Array.from(partSel.options).forEach(o => (o.selected = false));

  loadExpenses();
  showPanel("list");
  loadExpenses();
}

async function loadExpenses() {
  if (!currentProjectName) return;
  const res = await fetch(
    `${API_BASE}/expenses/by-project/${encodeURIComponent(currentProjectName)}`
  );
  const data = await res.json(); // List[ExpenseOut]
  const tbody = document.getElementById("expenses-tbody");
  tbody.innerHTML = "";

  data.forEach(e => {
    const tr = document.createElement("tr");

    // 找名字
    const payerName = findUserNameById(e.payer_id);
    const participantsNames = e.participant_ids
      .map(id => findUserNameById(id))
      .join(", ");

    const spentAt = e.spent_at || "";

    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.spent_at}</td>
      <td>${e.title}</td>
      <td>${payerName}</td>
      <td>${Number(e.amount).toFixed(2)}</td>
      <td>${participantsNames}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteExpense() {
  const id = parseInt(document.getElementById("delete-expense-id").value);
  if (!id) return;
  if (!confirm(`确认删除账目 #${id} ?`)) return;
  const res = await fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE" });
  if (res.ok) {
    document.getElementById("delete-expense-id").value = "";
    loadExpenses();
  } else {
    alert("删除失败");
  }
}

async function doSettlement() {
  if (!currentProjectName) return;
  const res = await fetch(
    `${API_BASE}/expenses/settlement/${encodeURIComponent(currentProjectName)}`
  );
  const data = await res.json(); // SettlementResult

  const summaryDiv = document.getElementById("settlement-summary");
  summaryDiv.innerHTML = `
    <p>项目：<strong>${data.project_name}</strong></p>
    <p>总金额：<strong>${Number(data.total_amount).toFixed(2)}</strong></p>
    <p>人均（粗略）：<strong>${Number(data.per_capita).toFixed(2)}</strong></p>
  `;

  const div = document.getElementById("settlement-transfers");
  let html = "<h4>每人结算余额（>0 应收，<0 应付）</h4><ul>";
  data.balances.forEach(b => {
    html += `<li>${b.user_name}: ${Number(b.balance).toFixed(2)}</li>`;
  });
  html += "</ul><h4>推荐转账方案</h4><ul>";
  data.transfers.forEach(t => {
    html += `<li>${t.from_user} → ${t.to_user}: ${Number(t.amount).toFixed(2)}</li>`;
  });
  html += "</ul>";
  div.innerHTML = html;

  showPanel("settlement");
}

