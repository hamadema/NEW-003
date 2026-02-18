
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, DesignCost, Payment, QuickButton } from './types';
import { storageService } from './services/storageService';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import { Icons } from './constants';

const PASSWORDS = {
  SANJAYA: 'san1980',
  RAVI: 'ravi2025'
};

const RAVI_PHONE = "94718010611";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [costs, setCosts] = useState<DesignCost[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
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
    method: 'Sampath Bank',
    saveAsPreset: false
  });

  const [managedQuickButtons, setManagedQuickButtons] = useState<QuickButton[]>([]);
  const [editingPreset, setEditingPreset] = useState<QuickButton | null>(null);

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
      setFormData(prev => ({ ...prev, method: 'Sampath Bank' }));
    } else {
      alert("Invalid Password");
    }
  };

  const sendWhatsAppUpdate = (description: string, newAmount: number, newExtra: number) => {
    // Calculate new totals for the message
    const currentTotalCosts = costs.reduce((acc, curr) => acc + (Number(curr.amount) || 0) + (Number(curr.extraCharges) || 0), 0);
    const currentTotalPaid = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    
    const updatedTotalCosts = currentTotalCosts + newAmount + newExtra;
    const updatedPending = updatedTotalCosts - currentTotalPaid;

    const message = `*Hello Ravi Aiya,* 👋\n\n` +
                    `*New Recent Work:* ${description}\n` +
                    `*Item Total:* Rs.${(newAmount + newExtra).toLocaleString()}\n\n` +
                    `--- Project Summary ---\n` +
                    `*Total Bill:* Rs.${updatedTotalCosts.toLocaleString()}\n` +
                    `*Pending:* Rs.${updatedPending > 0 ? updatedPending.toLocaleString() : '0'}\n\n` +
                    `*Please pay the pending balance as soon as possible. Thank you!* 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${RAVI_PHONE}?text=${encodedMessage}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const amountNum = parseFloat(formData.amount);
    const extraNum = parseFloat(formData.extraCharges) || 0;
    if (isNaN(amountNum) || amountNum <= 0) return alert("Enter valid amount");

    const finalDescription = formData.description.trim() || (currentUser.role === UserRole.SANJAYA ? "Design Work" : "Payment Settlement");

    if (currentUser.role === UserRole.SANJAYA) {
      const newCost: DesignCost = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        amount: amountNum,
        extraCharges: extraNum,
        description: finalDescription,
        type: formData.type,
        addedBy: currentUser.name
      };
      await storageService.saveCost(newCost, currentUser.email);

      // Trigger WhatsApp Notification
      sendWhatsAppUpdate(finalDescription, amountNum, extraNum);

      if (formData.saveAsPreset && formData.description.trim()) {
        const exists = managedQuickButtons.some(b => b.label.toLowerCase() === finalDescription.toLowerCase() && b.amount === amountNum);
        if (!exists) {
          const newBtn: QuickButton = { id: crypto.randomUUID(), label: finalDescription, amount: amountNum, type: 'Design' };
          const updated = [...managedQuickButtons, newBtn];
          setManagedQuickButtons(updated);
          storageService.saveQuickButtons(updated);
        }
      }
    } else {
      const newPayment: Payment = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        amount: amountNum,
        note: finalDescription,
        method: formData.method,
        addedBy: currentUser.name
      };
      await storageService.savePayment(newPayment, currentUser.email);
    }

    setIsAddModalOpen(false);
    setFormData({ amount: '', extraCharges: '', description: '', type: 'Design', method: 'Sampath Bank', saveAsPreset: false });
    setTimeout(loadData, 500); 
  };

  const handleDelete = async (id: string, type: 'COST' | 'PAYMENT') => {
    if (!window.confirm("Delete entry?")) return;
    await storageService.deleteEntry(id, type);
    setTimeout(loadData, 500);
  };

  const handleQuickAddClick = (btn: QuickButton) => {
    setFormData({
      amount: btn.amount.toString(),
      extraCharges: '',
      description: btn.label,
      type: btn.type,
      method: 'Sampath Bank',
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
    if (!window.confirm("Delete preset?")) return;
    const updated = managedQuickButtons.filter(b => b.id !== id);
    setManagedQuickButtons(updated);
    storageService.saveQuickButtons(updated);
    if (editingPreset?.id === id) setEditingPreset(null);
  };

  // Fix: Added addQuickButton function to handle adding new presets from the manager
  const addQuickButton = (label: string, amount: number) => {
    const newBtn: QuickButton = { id: crypto.randomUUID(), label, amount, type: 'Design' };
    const updated = [...managedQuickButtons, newBtn];
    setManagedQuickButtons(updated);
    storageService.saveQuickButtons(updated);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-xs w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
              <span className="text-white text-xl font-black">SR</span>
            </div>
            <h1 className="text-lg font-black text-slate-900 mb-1">Identity Check</h1>
            <p className="text-slate-500 mb-6 text-[10px] font-medium uppercase tracking-widest">Select Account</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setLoginState({ role: UserRole.SANJAYA, password: '' })}
                  className={`py-3 rounded-xl border-2 transition-all text-xs font-bold ${loginState.role === UserRole.SANJAYA ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400'}`}
                >
                  Sanjaya
                </button>
                <button 
                  type="button"
                  onClick={() => setLoginState({ role: UserRole.RAVI, password: '' })}
                  className={`py-3 rounded-xl border-2 transition-all text-xs font-bold ${loginState.role === UserRole.RAVI ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}
                >
                  Ravi
                </button>
              </div>

              {loginState.role !== UserRole.NONE && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <input 
                    type="password"
                    required
                    autoFocus
                    placeholder="Enter Secret Key"
                    value={loginState.password}
                    onChange={(e) => setLoginState({ ...loginState, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold text-lg"
                  />
                  <button type="submit" className={`w-full mt-4 py-3 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 ${loginState.role === UserRole.SANJAYA ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
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
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 py-2 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-${roleColor}-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}>
              {currentUser.name[0]}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-black text-slate-900">{currentUser.name}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                {currentUser.role === UserRole.SANJAYA ? 'Creative Lead' : 'Project Sponsor'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={loadData} disabled={isSyncing} className={`p-2 rounded-lg hover:bg-slate-100 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={() => setCurrentUser(null)} className="ml-1 text-[8px] font-black text-slate-400 uppercase border border-slate-100 px-2 py-1 rounded-md">Log Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        <Dashboard costs={costs} payments={payments} userRole={currentUser.role} onLogPaymentClick={() => setIsAddModalOpen(true)} />

        {currentUser.role === UserRole.SANJAYA && (
          <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Icons.Design /> Quick Bill Presets
              </h3>
              <button onClick={() => setIsQuickBillManagerOpen(true)} className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                Manage
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {managedQuickButtons.map((btn) => (
                <button 
                  key={btn.id} 
                  onClick={() => handleQuickAddClick(btn)} 
                  className="bg-slate-50 border border-slate-100 p-3 rounded-xl hover:border-emerald-500 hover:bg-white transition-all text-left active:scale-95 group"
                >
                  <p className="text-[10px] font-bold text-slate-500 mb-1 truncate">{btn.label}</p>
                  <p className="text-sm font-black text-slate-900 leading-none">Rs.{btn.amount}</p>
                </button>
              ))}
              <button onClick={() => setIsAddModalOpen(true)} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-3 text-slate-400 hover:border-emerald-500 transition-all">
                <Icons.Plus />
                <span className="text-[8px] font-black mt-1 uppercase">Custom</span>
              </button>
            </div>
          </section>
        )}

        <div className="space-y-2">
          <HistoryList costs={costs} payments={payments} onDelete={handleDelete} currentUser={currentUser} />
        </div>
      </main>

      {currentUser.role === UserRole.RAVI && (
        <div className="fixed bottom-6 right-6 z-40">
          <button onClick={() => setIsAddModalOpen(true)} className="w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform">
            <Icons.Plus />
          </button>
        </div>
      )}

      {/* Quick Bill Manager Modal */}
      {isQuickBillManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Preset Architect</h3>
              <button onClick={() => { setIsQuickBillManagerOpen(false); setEditingPreset(null); }} className="p-2 bg-slate-100 rounded-full text-slate-400">✕</button>
            </div>
            
            <div className="space-y-6">
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {managedQuickButtons.length === 0 && <p className="text-center py-6 text-slate-400 text-xs italic">No presets available.</p>}
                {managedQuickButtons.map((btn) => (
                  <div key={btn.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${editingPreset?.id === btn.id ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 text-sm truncate pr-2">{btn.label}</p>
                      <p className="text-xs font-black text-emerald-600">Rs.{btn.amount}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditingPreset(btn)} className="p-2 text-slate-400 hover:text-emerald-600 bg-white rounded-lg shadow-sm">
                        <Icons.Design />
                      </button>
                      <button onClick={() => deleteQuickButton(btn.id)} className="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-lg shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.currentTarget;
                    const label = (f.elements.namedItem('btn-label') as HTMLInputElement).value;
                    const amount = parseFloat((f.elements.namedItem('btn-amount') as HTMLInputElement).value);
                    if (label && amount > 0) {
                      if (editingPreset) {
                        const updated = managedQuickButtons.map(b => b.id === editingPreset.id ? { ...b, label, amount } : b);
                        setManagedQuickButtons(updated);
                        storageService.saveQuickButtons(updated);
                        setEditingPreset(null);
                      } else {
                        addQuickButton(label, amount);
                      }
                      f.reset();
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input name="btn-label" required defaultValue={editingPreset?.label || ''} placeholder="Preset Name" className="px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-slate-100" />
                    <input name="btn-amount" required type="number" defaultValue={editingPreset?.amount || ''} placeholder="Price" className="px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-slate-100" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl shadow-md active:scale-95 transition-all text-sm">
                    {editingPreset ? 'Update Preset' : 'Add to Presets'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Link Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Cloud Link</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">GAS Webhook URL</label>
              <textarea 
                rows={3}
                value={gasUrl} 
                onChange={(e) => setGasUrl(e.target.value)} 
                className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl font-mono text-[10px] focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                placeholder="https://script.google.com/..." 
              />
              <button onClick={saveSettings} className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg transition-all active:scale-95">Establish Link</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {currentUser.role === UserRole.SANJAYA ? 'Design Work Entry' : <><Icons.Wallet /> Pay</>}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                    {currentUser.role === UserRole.SANJAYA ? 'Base Cost (Rs.)' : 'Paid Amount (Rs.)'}
                  </label>
                  <input autoFocus required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xl font-black outline-none border border-slate-100" placeholder="0.00" />
                </div>
                
                {currentUser.role === UserRole.SANJAYA && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Extra Charges (Rs.)</label>
                    <input type="number" step="0.01" value={formData.extraCharges} onChange={(e) => setFormData({...formData, extraCharges: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-base font-black outline-none border border-slate-100 text-emerald-600" placeholder="0.00" />
                  </div>
                )}

                {currentUser.role === UserRole.RAVI && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Payment Method</label>
                    <select 
                      value={formData.method} 
                      onChange={(e) => setFormData({...formData, method: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none border border-slate-100 text-sm"
                    >
                      <option value="Sampath Bank">Sampath Bank</option>
                      <option value="Other Banks">Other Banks</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                    Reference Note <span className="opacity-50">(Optional)</span>
                  </label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold outline-none border border-slate-100 text-sm" placeholder={currentUser.role === UserRole.SANJAYA ? "e.g. Logo Revision" : "e.g. Monthly Settlement"} />
                </div>
              </div>

              {currentUser.role === UserRole.SANJAYA && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <input 
                    type="checkbox" 
                    id="saveAsPreset" 
                    checked={formData.saveAsPreset} 
                    onChange={(e) => setFormData({...formData, saveAsPreset: e.target.checked})}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <label htmlFor="saveAsPreset" className="text-[10px] font-black text-emerald-800 uppercase tracking-tighter cursor-pointer">
                    Save as quick bill preset?
                  </label>
                </div>
              )}
              
              <button type="submit" className={`w-full py-4 bg-${roleColor}-600 text-white font-black rounded-xl shadow-lg active:scale-95 mt-2 transition-all`}>
                Finalize {currentUser.role === UserRole.SANJAYA ? 'Bill' : 'Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
