// --- 全局依赖解构 ---
const { useState, useEffect } = React;

// --- 配置 ---
const API_BASE = "http://127.0.0.1:8001"; // FastAPI 地址

// --- API Service ---
const api = {
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  createUser: async (name) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },
  getProjects: async () => {
    const res = await fetch(`${API_BASE}/expenses/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },
  createExpense: async (payload) => {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
  },
  getExpenses: async (projectName) => {
    const res = await fetch(`${API_BASE}/expenses/by-project/${encodeURIComponent(projectName)}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },
  deleteExpense: async (id) => {
    const res = await fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error('Failed to delete expense');
  },
  getSettlement: async (projectName) => {
    const res = await fetch(`${API_BASE}/expenses/settlement/${encodeURIComponent(projectName)}`);
    if (!res.ok) throw new Error('Failed to fetch settlement');
    return res.json();
  }
};

// --- UI 组件库 ---

// 1. 通用按钮
const Button = ({ children, variant = 'primary', className = '', isLoading = false, disabled, onClick, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          处理中...
        </span>
      ) : children}
    </button>
  );
};

// 2. 组件：用户选择
const UserSelection = ({ onUserSelected }) => {
  const [mode, setMode] = useState('select');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      alert('无法加载用户列表，请确保后端已启动');
    }
  };

  const handleSelect = () => {
    const user = users.find(u => u.id === Number(selectedUserId));
    if (user) onUserSelected(user);
  };

  const handleCreate = async () => {
    if (!newUserName.trim()) return;
    setIsLoading(true);
    try {
      const newUser = await api.createUser(newUserName);
      onUserSelected(newUser);
    } catch (error) {
      console.error(error);
      alert('创建用户失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-100 mt-10">
      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800">你是谁?</h2>
        <p className="text-gray-500 mt-2">请确认你的身份以开始记账</p>
      </div>

      <div className="flex gap-2 p-1 bg-gray-50 rounded-lg mb-6">
        <button onClick={() => setMode('select')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'select' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>选择现有用户</button>
        <button onClick={() => setMode('create')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>创建新用户</button>
      </div>

      {mode === 'select' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户列表</label>
            <div className="relative">
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white">
                <option value="" disabled>选择一个名字...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <Button className="w-full flex items-center justify-center gap-2" disabled={!selectedUserId} onClick={handleSelect}>继续</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新用户名</label>
            <div className="relative">
              <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="例如: 张三" className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <Button className="w-full flex items-center justify-center gap-2" disabled={!newUserName.trim()} onClick={handleCreate} isLoading={isLoading}>创建并进入</Button>
        </div>
      )}
    </div>
  );
};

// 3. 组件：项目选择
const ProjectSelection = ({ currentUser, onProjectSelected, onBack }) => {
  const [mode, setMode] = useState('select');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());

  useEffect(() => {
    loadData();
    // 默认勾选自己
    if (currentUser) {
      setSelectedParticipants(new Set([currentUser.id]));
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [projectsData, usersData] = await Promise.all([api.getProjects(), api.getUsers()]);
      setProjects(projectsData);
      setAllUsers(usersData);
    } catch (error) { console.error(error); }
  };

  const handleSelect = () => { if (selectedProject) onProjectSelected(selectedProject); };
  
  const handleCreate = () => { 
    if (newProjectName.trim()) {
        // 创建项目时，将预选的参与人传给回调
        onProjectSelected(newProjectName.trim(), Array.from(selectedParticipants)); 
    }
  };

  const toggleParticipant = (id) => {
    const next = new Set(selectedParticipants);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedParticipants(next);
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-100 mt-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← 切换用户</button>
        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">当前: {currentUser ? currentUser.name : ''}</span>
      </div>

      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800">选择账本</h2>
        <p className="text-gray-500 mt-2">加入现有活动或开启新旅程</p>
      </div>

      <div className="flex gap-2 p-1 bg-gray-50 rounded-lg mb-6">
        <button onClick={() => setMode('select')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'select' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>现有项目</button>
        <button onClick={() => setMode('create')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'create' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>新建项目</button>
      </div>

      {mode === 'select' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目列表</label>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white">
              <option value="" disabled>选择一个项目...</option>
              {projects.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
            </select>
            {projects.length === 0 && <p className="text-xs text-gray-400 mt-1">暂无项目，请先新建。</p>}
          </div>
          <Button className="w-full flex items-center justify-center gap-2 !bg-green-600 hover:!bg-green-700 focus:!ring-green-500" disabled={!selectedProject} onClick={handleSelect}>进入账本</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
            <div className="relative">
              <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="例如: 2025 国庆出游" className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">常用参与人 (选填)</label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {allUsers.map(user => (
                <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" checked={selectedParticipants.has(user.id)} onChange={() => toggleParticipant(user.id)} className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
                  <span className="ml-2 text-sm text-gray-700">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button className="w-full flex items-center justify-center gap-2 !bg-green-600 hover:!bg-green-700 focus:!ring-green-500" disabled={!newProjectName.trim()} onClick={handleCreate}>创建并进入</Button>
        </div>
      )}
    </div>
  );
};

// 4. 组件：主控台 Dashboard
const Dashboard = ({ currentUser, projectName, initialParticipants = [], onExitProject, onLogout }) => {
  const [activeTab, setActiveTab] = useState('add');
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlement, setSettlement] = useState(null);

  // 新增账单状态
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [payerId, setPayerId] = useState(currentUser ? currentUser.id : undefined);
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { 
    if(initialParticipants.length > 0) {
        setSelectedParticipants(new Set(initialParticipants));
    } else if (currentUser) {
        setSelectedParticipants(new Set([currentUser.id]));
    }
  }, [initialParticipants, currentUser]);

  useEffect(() => { loadUsers(); loadExpenses(); }, [projectName]);

  const loadUsers = async () => { try { setUsers(await api.getUsers()); } catch (e) { console.error(e); } };
  const loadExpenses = async () => { try { setExpenses(await api.getExpenses(projectName)); } catch (e) { console.error(e); } };
  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : `ID:${id}`;
  };

  const handleCreateExpense = async () => {
    if (!title || !amount || selectedParticipants.size === 0) { alert('请填写完整信息'); return; }
    setIsSubmitting(true);
    try {
      await api.createExpense({
        project_name: projectName,
        title,
        amount: parseFloat(amount),
        payer_id: payerId,
        participant_ids: Array.from(selectedParticipants),
        spent_at: date || null
      });
      setTitle(''); setAmount(''); setDate('');
      await loadExpenses();
      setActiveTab('list');
    } catch (e) { alert('保存失败'); } finally { setIsSubmitting(false); }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('确认删除此账目?')) return;
    try { await api.deleteExpense(id); loadExpenses(); } catch (e) { alert('删除失败'); }
  };

  const handleSettle = async () => {
    try { setSettlement(await api.getSettlement(projectName)); setActiveTab('settle'); } catch (e) { alert('结算计算失败'); }
  };

  const toggleParticipant = (id) => {
    const next = new Set(selectedParticipants);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedParticipants(next);
  };

  // --- Sub-Renders ---

  const renderAddExpense = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">新增账目</h3>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消费内容</label>
            <div className="relative">
               <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例如: 晚餐, 打车" className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 font-bold">¥</span>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">付款人</label>
            <select value={payerId} onChange={e => setPayerId(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期 (可选)</label>
            <div className="relative">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">参与分摊 ({selectedParticipants.size}人)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {users.map(u => {
              const isSelected = selectedParticipants.has(u.id);
              return (
                <button key={u.id} onClick={() => toggleParticipant(u.id)} className={`flex items-center justify-center px-3 py-2 text-sm rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {u.name}
                </button>
              );
            })}
          </div>
        </div>
        <Button onClick={handleCreateExpense} isLoading={isSubmitting} className="w-full mt-4 !bg-blue-600 hover:!bg-blue-700">保存账目</Button>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-700 flex items-center">账目明细</h3>
        <Button variant="ghost" onClick={loadExpenses} className="!p-1">刷新</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr><th className="px-4 py-3">日期</th><th className="px-4 py-3">内容</th><th className="px-4 py-3">金额</th><th className="px-4 py-3">付款人</th><th className="px-4 py-3 hidden md:table-cell">参与人</th><th className="px-4 py-3 text-right">操作</th></tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无账目记录</td></tr> : expenses.map(e => (
              <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{e.spent_at || '-'}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{e.title}</td>
                <td className="px-4 py-3 font-bold text-gray-800">¥{e.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-blue-600">{getUserName(e.payer_id)}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs max-w-xs truncate">{e.participant_ids.map(id => getUserName(id)).join(', ')}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDeleteExpense(e.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettle = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      {!settlement ? (
        <div className="text-center py-10"><p className="text-gray-500 mb-4">尚未计算</p><Button onClick={handleSettle}>开始计算</Button></div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-xl"><p className="text-sm text-blue-600 mb-1">总支出</p><p className="text-2xl font-bold text-blue-800">¥{settlement.total_amount.toFixed(2)}</p></div>
            <div className="bg-green-50 p-4 rounded-xl"><p className="text-sm text-green-600 mb-1">人均支出</p><p className="text-2xl font-bold text-green-800">¥{settlement.per_capita.toFixed(2)}</p></div>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-3">余额情况</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settlement.balances.map((b, idx) => (
                <div key={idx} className={`p-3 rounded-lg flex justify-between items-center ${b.balance > 0 ? 'bg-green-50 text-green-800' : b.balance < 0 ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-600'}`}>
                  <span className="font-medium">{b.user_name}</span>
                  <span className="font-bold">{b.balance > 0 ? '应收' : b.balance < 0 ? '应付' : '结清'} {Math.abs(b.balance).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-3 border-l-4 border-yellow-500 pl-3">推荐转账方案</h4>
            {settlement.transfers.length === 0 ? <p className="text-gray-500 italic">无需转账，大家已结清。</p> : (
              <div className="bg-yellow-50 rounded-lg divide-y divide-yellow-100">
                {settlement.transfers.map((t, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="font-bold text-gray-800">{t.from_user}</span><span className="text-gray-400 text-xs">支付给</span><span className="font-bold text-gray-800">{t.to_user}</span></div>
                    <span className="font-bold text-yellow-700">¥{t.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSettle} variant="secondary" className="w-full">重新计算</Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-10">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <div className="flex flex-col"><span className="text-xs text-gray-500">当前项目</span><span className="font-bold text-gray-900 leading-tight">{projectName}</span></div>
          </div>
          <div className="flex items-center space-x-3">
             <div className="hidden sm:flex flex-col items-end mr-2"><span className="text-xs text-gray-500">操作用户</span><span className="font-medium text-gray-900 leading-tight">{currentUser ? currentUser.name : ''}</span></div>
             <Button variant="ghost" onClick={onExitProject} className="!p-2 text-gray-500" title="切换项目">切换项目</Button>
             <Button variant="ghost" onClick={onLogout} className="!p-2 text-red-400 hover:text-red-600" title="切换用户">切换用户</Button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex space-x-6 border-t border-gray-100">
          <button onClick={() => setActiveTab('add')} className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'add' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>记一笔</button>
          <button onClick={() => { setActiveTab('list'); loadExpenses(); }} className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>查看账目</button>
          <button onClick={() => { handleSettle(); }} className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'settle' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>结算</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'add' && renderAddExpense()}
        {activeTab === 'list' && renderList()}
        {activeTab === 'settle' && renderSettle()}
      </main>
    </div>
  );
};
