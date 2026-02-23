
import React from 'react';
import { DesignCost, Payment, UserRole } from '../types';
import { Icons } from '../constants';

interface DashboardProps {
  costs: DesignCost[];
  payments: Payment[];
  userRole: UserRole;
  onLogPaymentClick: (amount?: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ costs, payments, userRole, onLogPaymentClick }) => {
  const totalCosts = costs.reduce((acc, curr) => acc + (Number(curr.amount) || 0) + (Number(curr.extraCharges) || 0), 0);
  const totalPaid = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const balance = totalPaid - totalCosts;

  const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;
  const latestWork = costs.length > 0 ? costs[costs.length - 1] : null;

  const isRaviOwing = balance < 0;
  const displayBalance = Math.abs(balance) || 0;
  const percentCleared = totalCosts > 0 ? Math.min(100, (totalPaid / totalCosts) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Primary Balance Card */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-4 bg-gradient-to-br from-white to-slate-50/30">
          <div>
            <h2 className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] mb-2">Treasury Pulse</h2>
            <div className="flex flex-col items-center gap-1">
              <span className={`text-3xl font-black tracking-tight break-all ${balance === 0 ? 'text-slate-900' : isRaviOwing ? 'text-rose-600' : 'text-emerald-600'}`}>
                Rs.{displayBalance.toLocaleString()}
              </span>
              <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${balance === 0 ? 'bg-slate-50 text-slate-500 border-slate-100' : isRaviOwing ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {balance === 0 ? 'Settled' : isRaviOwing ? 'Pending' : 'Credit'}
              </span>
            </div>
          </div>
          
          {userRole === UserRole.RAVI && balance < 0 && (
            <button 
              onClick={() => onLogPaymentClick(displayBalance)} 
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Icons.Wallet /> Full PAY
            </button>
          )}
        </div>
        
        <div className="px-6 pb-4">
           <div className="flex justify-between items-center mb-1 text-[7px] font-black text-slate-400 uppercase">
              <span>Payment Progress</span>
              <span className="text-slate-900">{percentCleared.toFixed(0)}% Clear</span>
           </div>
           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${percentCleared === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${percentCleared}%` }}
              ></div>
           </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-50 bg-slate-50/40 divide-x divide-slate-100">
          <div className="p-3 text-center">
            <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest mb-1">Total Bill</p>
            <p className="text-xs font-black text-slate-800 break-all">Rs.{totalCosts.toLocaleString()}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest mb-1">Total Paid</p>
            <p className="text-xs font-black text-slate-800 break-all">Rs.{totalPaid.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
            <Icons.Design />
          </div>
          <div className="overflow-hidden">
            <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Recent Work</p>
            <p className="text-[10px] font-black text-slate-900 truncate pr-1">{latestWork ? latestWork.description : 'None'}</p>
            <p className="text-[9px] font-black text-emerald-600">
              Rs.{(Number(latestWork?.amount) || 0) + (Number(latestWork?.extraCharges) || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
            <Icons.Wallet />
          </div>
          <div className="overflow-hidden">
            <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Recent Pay</p>
            <p className="text-[10px] font-black text-slate-900 truncate pr-1">{latestPayment ? (latestPayment.note || latestPayment.method) : 'None'}</p>
            <p className="text-[9px] font-black text-indigo-600">Rs.{latestPayment ? latestPayment.amount.toLocaleString() : '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
