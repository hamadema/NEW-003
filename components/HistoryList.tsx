
import React from 'react';
import { DesignCost, Payment, User } from '../types';

interface HistoryListProps {
  costs: DesignCost[];
  payments: Payment[];
  onDelete: (id: string, type: 'COST' | 'PAYMENT') => void;
  currentUser: User;
}

const HistoryList: React.FC<HistoryListProps> = ({ costs, payments, onDelete, currentUser }) => {
  const allItems = [
    ...costs.map(c => ({ ...c, itemType: 'COST' as const })),
    ...payments.map(p => ({ ...p, itemType: 'PAYMENT' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allItems.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-400 text-xs font-medium">No activity logged.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Activity</h3>
        <span className="text-[9px] text-slate-400 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-100">{allItems.length}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {allItems.map((item) => {
          const rawItem = item as any;
          const baseAmount = Number(rawItem.amount) || 0;
          const extraCharges = item.itemType === 'COST' ? (Number(rawItem.extraCharges) || 0) : 0;
          const totalAmount = baseAmount + extraCharges;
          const isOwner = item.addedBy === currentUser.name || currentUser.name === 'Sanjaya';
          
          const displayLabel = item.itemType === 'COST' 
            ? (rawItem.description || 'Design Work') 
            : (rawItem.note || 'Payment');
          
          return (
            <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors active:bg-slate-100">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.itemType === 'COST' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <span className="text-[7px] font-black uppercase tracking-tighter">
                    {item.itemType === 'COST' ? 'WORK' : 'PAY'}
                  </span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate pr-1">
                    {displayLabel}
                  </p>
                  <div className="flex items-center gap-1.5 text-[8px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">
                    <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <span className="truncate">By {item.addedBy}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className={`font-black text-xs break-all ${item.itemType === 'COST' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {item.itemType === 'COST' ? '-' : '+'}Rs.{totalAmount.toLocaleString()}
                  </p>
                  {extraCharges > 0 && (
                    <p className="text-[7px] text-slate-400 font-bold uppercase">+Rs.{extraCharges} extra</p>
                  )}
                </div>
                {(currentUser.role === 'SANJAYA' || (currentUser.role === 'RAVI' && item.itemType === 'PAYMENT' && isOwner)) && (
                  <button 
                    onClick={() => onDelete(item.id, item.itemType)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
