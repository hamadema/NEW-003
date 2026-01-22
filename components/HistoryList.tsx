
import React from 'react';
import { DesignCost, Payment, User } from '../types';

interface HistoryListProps {
  costs: DesignCost[];
  payments: Payment[];
  onDelete: (id: string, type: 'COST' | 'PAYMENT') => void;
  currentUser: User;
}

const HistoryList: React.FC<HistoryListProps> = ({ costs, payments, onDelete, currentUser }) => {
  // Combine costs and payments into a single history feed
  const allItems = [
    ...costs.map(c => ({ ...c, itemType: 'COST' as const })),
    ...payments.map(p => ({ ...p, itemType: 'PAYMENT' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allItems.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-400">No activity logged yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <h3 className="font-semibold text-slate-700">Recent Transactions</h3>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">{allItems.length} Entries</span>
      </div>
      <div className="divide-y divide-slate-100">
        {allItems.map((item) => {
          const rawItem = item as any;
          const baseAmount = Number(rawItem.amount) || 0;
          const extraCharges = item.itemType === 'COST' ? (Number(rawItem.extraCharges) || 0) : 0;
          const totalAmount = baseAmount + extraCharges;
          const isOwner = item.addedBy === currentUser.name || currentUser.name === 'Sanjaya'; // Sanjaya can delete anything? No, let's keep it based on role if needed.
          
          const displayLabel = item.itemType === 'COST' 
            ? (rawItem.description || rawItem.desc || rawItem.work || 'Cost Entry') 
            : (rawItem.note || rawItem.description || rawItem.desc || 'Payment');
          
          const subLabel = item.itemType === 'COST' 
            ? (rawItem.type || 'Design') 
            : (rawItem.method || 'GPay');

          return (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.itemType === 'COST' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <span className="text-[10px] font-black">{item.itemType === 'COST' ? 'WORK' : 'PAY'}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 leading-tight">
                    {displayLabel}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 uppercase font-medium tracking-wide">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>By {item.addedBy || 'System'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`font-bold text-base ${item.itemType === 'COST' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.itemType === 'COST' ? '-' : '+'}₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </p>
                  {extraCharges > 0 && (
                    <p className="text-[9px] text-slate-400 font-medium">Incl. ₹{extraCharges} extra</p>
                  )}
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                    {subLabel}
                  </p>
                </div>
                {/* Sanjaya can delete anything. Ravi can only delete his payments. */}
                {(currentUser.role === 'SANJAYA' || (currentUser.role === 'RAVI' && item.itemType === 'PAYMENT' && isOwner)) && (
                  <button 
                    onClick={() => onDelete(item.id, item.itemType)}
                    className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 rounded-lg"
                    title="Delete entry"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryList;
