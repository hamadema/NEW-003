
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, DesignCost, Payment, QuickButton } from './types';
import { storageService } from './services/storageService';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import { Icons } from './constants';

const PASSWORDS = {
  SANJAYA: 'san1980',
  RAVI: 'ravi2025'
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [costs, setCosts] = useState<DesignCost[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickBillManagerOpen, setIsQuickBillManagerOpen] = useState(false);
  const [gasUrl, setGasUrl] = useState(storageService.getGasUrl());
  const [loginState, setLoginState] = useState({ role: UserRole.NONE, password: '' });
  
  const [formData, setFormData] = useState({
    amount: '',
    extraCharges: '',
    description: '',
    type: 'Design',
    method: 'GPay',
    saveAsPreset: false
  });

  const [managedQuickButtons, setManagedQuickButtons] = useState<QuickButton[]>([]);

  const loadData = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const [c, p] = await Promise.all([
        storageService.getCosts(),
        storageService.getPayments()
      ]);
      setCosts(c);
      setPayments(p);
      setManagedQuickButtons(storageService.getQuickButtons());
      setLastSync(new Date());
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    if (currentUser) {
      loadData();
      const interval = setInterval(loadData, 60000); 
      return () => clearInterval(interval);
    }
  }, [currentUser, loadData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { role, password } = loginState;
    if (role === UserRole.SANJAYA && password === PASSWORDS.SANJAYA) {
      setCurrentUser({ role, name: 'Sanjaya', email: 'sanjaya@designer.com' });
    } else if (role === UserRole.RAVI && password === PASSWORDS.RAVI) {
      setCurrentUser({ role, name: 'Ravi', email: 'ravi2025@client.com' });
    } else {
      alert("Invalid Password");
    }
  };

  const addQuickButton = (label: string, amount: number) => {
    const newBtn: QuickButton = { id: crypto.randomUUID(), label, amount, type: 'Design' };
    const updated = [...managedQuickButtons, newBtn];
    setManagedQuickButtons(updated);
    storageService.saveQuickButtons(updated);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const amountNum = parseFloat(formData.amount);
    const extraNum = parseFloat(formData.extraCharges) || 0;
    if (isNaN(amountNum) || amountNum <= 0) return alert("Enter valid amount");

    if (currentUser.role === UserRole.SANJAYA) {
      const newCost: DesignCost = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        amount: amountNum,
        extraCharges: extraNum,
        description: formData.description,
        type: formData.type,
        addedBy: currentUser.name
      };
      await storageService.saveCost(newCost, currentUser.email);

      // Save as preset if requested
      if (formData.saveAsPreset) {
        // Check if a similar preset already exists to avoid duplicates
        const exists = managedQuickButtons.some(b => b.label.toLowerCase() === formData.description.toLowerCase() && b.amount === amountNum);
        if (!exists) {
          addQuickButton(formData.description, amountNum);
        }
      }
    } else {
      const newPayment: Payment = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        amount: amountNum,
        note: formData.description,
        method: formData.method,
        addedBy: currentUser.name
      };
      await storageService.savePayment(newPayment, currentUser.email);
    }

    setIsAddModalOpen(false);
    setFormData({ amount: '', extraCharges: '', description: '', type: 'Design', method: 'GPay', saveAsPreset: false });
    setTimeout(loadData, 500); 
  };

  const handleDelete = async (id: string, type: 'COST' | 'PAYMENT') => {
    if (!window.confirm("Delete this entry?")) return;
    await storageService.deleteEntry(id, type);
    setTimeout(loadData, 500);
  };

  const handleQuickAddClick = (btn: QuickButton) => {
    setFormData({
      amount: btn.amount.toString(),
      extraCharges: '',
      description: btn.label,
      type: btn.type,
      method: 'GPay',
      saveAsPreset: false
    });
    setIsAddModalOpen(true);
  };

  const saveSettings = () => {
    storageService.setGasUrl(gasUrl);
    setIsSettingsOpen(false);
    loadData();
  };

  const deleteQuickButton = (id: string) => {
    const updated = managedQuickButtons.filter(b => b.id !== id);
    setManagedQuickButtons(updated);
    storageService.saveQuickButtons(updated);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl rotate-6 transition-transform hover:rotate-12">
              <span className="text-white text-4xl font-black">SR</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Identity Check</h1>
            <p className="text-slate-500 mb-10 font-medium">Select your portal to continue</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setLoginState({ role: UserRole.SANJAYA, password: '' })}
                  className={`py-5 rounded-3xl border-2 transition-all font-bold ${loginState.role === UserRole.SANJAYA ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400 bg-slate-50'}`}
                >
                  Sanjaya
                </button>
                <button 
                  type="button"
                  onClick={() => setLoginState({ role: UserRole.RAVI, password: '' })}
                  className={`py-5 rounded-3xl border-2 transition-all font-bold ${loginState.role === UserRole.RAVI ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 bg-slate-50'}`}
                >
                  Ravi
                </button>
              </div>

              {loginState.role !== UserRole.NONE && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <input 
                    type="password"
                    required
                    autoFocus
                    placeholder="Enter Secret Key"
                    value={loginState.password}
                    onChange={(e) => setLoginState({ ...loginState, password: e.target.value })}
                    className="w-full px-8 py-5 bg-slate-100 border-none rounded-[24px] outline-none focus:ring-4 focus:ring-indigo-500/20 text-center font-bold text-xl tracking-widest"
                  />
                  <button type="submit" className={`w-full mt-6 py-5 text-white font-black rounded-[24px] shadow-xl transition-all active:scale-95 ${loginState.role === UserRole.SANJAYA ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                    Open Workspace
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  const roleColor = currentUser.role === UserRole.SANJAYA ? 'emerald' : 'indigo';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-${roleColor}-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white`}>
              {currentUser.name[0]}
            </div>
            <div>
              <p className="text-base font-black text-slate-900">{currentUser.name}</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full bg-${roleColor}-500 animate-pulse`}></div>
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-black">
                  {currentUser.role === UserRole.SANJAYA ? 'Creative Director' : 'Project Sponsor'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadData} 
              disabled={isSyncing}
              className={`p-3 rounded-2xl hover:bg-slate-100 transition-colors ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-400'}`}
              title="Cloud Sync"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-2xl transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={() => setCurrentUser(null)} className="ml-2 text-[11px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest border-2 border-slate-100 px-5 py-2.5 rounded-2xl hover:border-rose-100 transition-all">Exit</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-10">
        <Dashboard costs={costs} payments={payments} userRole={currentUser.role} onLogPaymentClick={() => setIsAddModalOpen(true)} />

        {currentUser.role === UserRole.SANJAYA && (
          <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <button 
                onClick={() => setIsQuickBillManagerOpen(true)}
                className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100 shadow-sm transition-all active:scale-95"
              >
                Config Presets
              </button>
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-400 mb-10 flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-[14px] flex items-center justify-center shadow-inner">
                 <Icons.Design />
               </div>
               Quick Bill Launchpad
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {managedQuickButtons.map((btn) => (
                <button 
                  key={btn.id} 
                  onClick={() => handleQuickAddClick(btn)} 
                  className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] hover:border-emerald-500 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/10 transition-all text-left active:scale-95 group"
                >
                  <p className="text-[12px] font-bold text-slate-500 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-1">{btn.label}</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">₹{btn.amount.toLocaleString()}</p>
                </button>
              ))}
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center p-6 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Icons.Plus />
                </div>
                <span className="text-[11px] font-black mt-3 uppercase tracking-widest">New Custom</span>
              </button>
            </div>
          </section>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-500 rounded-full shadow-lg shadow-indigo-200"></div>
              Ledger Transactions
            </h3>
            {isSyncing && <span className="text-[11px] font-black text-indigo-500 uppercase animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              Syncing Cloud...
            </span>}
          </div>
          <HistoryList costs={costs} payments={payments} onDelete={handleDelete} currentUser={currentUser} />
        </div>
      </main>

      {/* Floating Plus for Ravi */}
      {currentUser.role === UserRole.RAVI && (
        <div className="fixed bottom-12 right-12 z-40 group">
          <button onClick={() => setIsAddModalOpen(true)} className={`w-20 h-20 rounded-[28px] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 hover:scale-110 transition-all flex items-center justify-center active:rotate-90 hover:rotate-12`}>
            <Icons.Plus />
          </button>
        </div>
      )}

      {isQuickBillManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden p-12">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Preset Architect</h3>
                <p className="text-slate-500 text-sm font-medium mt-2">Manage your most frequent billing templates</p>
              </div>
              <button onClick={() => setIsQuickBillManagerOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all">✕</button>
            </div>
            
            <div className="space-y-10">
              <div className="max-h-[350px] overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                {managedQuickButtons.length === 0 && <p className="text-center py-12 text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-3xl">No billing presets architected yet.</p>}
                {managedQuickButtons.map((btn) => (
                  <div key={btn.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px] border border-slate-100 group hover:border-emerald-300 transition-all">
                    <div>
                      <p className="font-black text-slate-800 text-lg">{btn.label}</p>
                      <p className="text-base font-black text-emerald-600">₹{btn.amount.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => deleteQuickButton(btn.id)}
                      className="w-10 h-10 flex items-center justify-center bg-white text-slate-300 hover:text-rose-500 shadow-sm rounded-xl transition-all hover:scale-110"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t-2 border-slate-50">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6">Forge New Preset</p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.currentTarget;
                    const label = (f.elements.namedItem('btn-label') as HTMLInputElement).value;
                    const amount = parseFloat((f.elements.namedItem('btn-amount') as HTMLInputElement).value);
                    if (label && amount > 0) {
                      addQuickButton(label, amount);
                      f.reset();
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <input name="btn-label" required placeholder="Project Name" className="md:col-span-2 px-6 py-5 bg-slate-100 border-none rounded-[20px] font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 text-lg" />
                  <input name="btn-amount" required type="number" placeholder="Cost" className="px-6 py-5 bg-slate-100 border-none rounded-[20px] font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 text-lg" />
                  <button type="submit" className="md:col-span-3 py-5 bg-emerald-600 text-white font-black rounded-[20px] shadow-2xl shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 text-lg">Add to Presets</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden p-12">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900">Cloud Link</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-10">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">GAS Web App Webhook</label>
                <textarea 
                  rows={4}
                  value={gasUrl} 
                  onChange={(e) => setGasUrl(e.target.value)} 
                  className="w-full px-6 py-6 bg-slate-100 border-none rounded-[24px] font-mono text-xs focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none leading-relaxed" 
                  placeholder="https://script.google.com/macros/s/.../exec" 
                />
              </div>
              <div className="p-8 bg-indigo-50/50 rounded-[32px] border-2 border-indigo-100/50">
                <p className="text-xs text-indigo-900 leading-loose font-bold italic">
                  Tip: Ensure "Execute as: Me" and "Access: Anyone" are set in your Google Script deployment for the ledger to sync across devices.
                </p>
              </div>
              <button onClick={saveSettings} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[24px] hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 text-lg">Establish Connection</button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden p-12">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{currentUser.role === UserRole.SANJAYA ? 'Design Billing' : 'Log Settlement'}</h3>
                <p className="text-slate-500 text-sm font-medium mt-2">Update your project ledger</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddEntry} className="space-y-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Main Cost (₹)</label>
                  <input autoFocus required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-8 py-6 bg-slate-100 border-none rounded-[24px] text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300" placeholder="0.00" />
                </div>
                {currentUser.role === UserRole.SANJAYA && (
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Extra Charges (₹)</label>
                    <input type="number" step="0.01" value={formData.extraCharges} onChange={(e) => setFormData({...formData, extraCharges: e.target.value})} className="w-full px-8 py-5 bg-slate-100 border-none rounded-[24px] text-xl font-black outline-none focus:ring-4 focus:ring-emerald-500/10 text-emerald-600 placeholder:text-slate-300" placeholder="0.00" />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Reference / Service Details</label>
                  <input required type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-8 py-5 bg-slate-100 border-none rounded-[24px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 text-lg placeholder:text-slate-300" placeholder={currentUser.role === UserRole.SANJAYA ? "e.g. Logo Revision v2" : "GPay Settlement..."} />
                </div>
              </div>

              {currentUser.role === UserRole.SANJAYA && (
                <div className="flex items-center gap-4 bg-emerald-50/50 p-5 rounded-[24px] border border-emerald-100">
                  <input 
                    type="checkbox" 
                    id="saveAsPreset" 
                    checked={formData.saveAsPreset} 
                    onChange={(e) => setFormData({...formData, saveAsPreset: e.target.checked})}
                    className="w-6 h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="saveAsPreset" className="text-sm font-black text-emerald-800 cursor-pointer select-none">
                    Remember this as a Quick Bill Preset?
                  </label>
                </div>
              )}
              
              <button type="submit" className={`w-full py-6 bg-${roleColor}-600 hover:bg-${roleColor}-700 text-white font-black rounded-[24px] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 shadow-${roleColor}-600/30 mt-6 text-xl`}>
                <Icons.Plus /> Finalize Entry
              </button>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid white; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
