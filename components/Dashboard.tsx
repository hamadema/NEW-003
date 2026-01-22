
import React from 'react';
import { DesignCost, Payment, UserRole } from '../types';

interface DashboardProps {
  costs: DesignCost[];
  payments: Payment[];
  userRole: UserRole;
  onLogPaymentClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ costs, payments, userRole, onLogPaymentClick }) => {
  const totalCosts = costs.reduce((acc, curr) => acc + (Number(curr.amount) || 0) + (Number(curr.extraCharges) || 0), 0);
  const totalPaid = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const balance = totalPaid - totalCosts;

  const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;
  const latestWork = costs.length > 0 ? costs[costs.length - 1] : null;

  const isRaviOwing = balance < 0;
  const isCredit = balance > 0;
  const displayBalance = Math.abs(balance) || 0;
  
  const percentCleared = totalCosts > 0 ? Math.min(100, (totalPaid / totalCosts) * 100) : 100;

  // Calculate last 30 days metrics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCosts = costs.filter(c => new Date(c.date) > thirtyDaysAgo).reduce((acc, curr) => acc + (Number(curr.amount) || 0) + (Number(curr.extraCharges) || 0), 0);
  const recentPayments = payments.filter(p => new Date(p.date) > thirtyDaysAgo).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-8">
      {/* Primary Balance Card */}
      <div className="bg-white rounded-[48px] shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden transition-all hover:shadow-indigo-500/5">
        <div className="p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-gradient-to-br from-white to-slate-50/50">
          <div>
            <h2 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mb-4">Project Treasury Status</h2>
            <div className="flex items-baseline gap-4">
              <span className={`text-6xl font-black tracking-tighter ${balance === 0 ? 'text-slate-900' : isRaviOwing ? 'text-rose-600' : 'text-emerald-600'}`}>
                Rs.{displayBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className={`text-slate-500 font-black bg-${balance === 0 ? 'slate' : isRaviOwing ? 'rose' : 'emerald'}-50 px-5 py-2 rounded-full text-[11px] uppercase tracking-widest border border-slate-100`}>
                {balance === 0 ? 'Settled' : isRaviOwing ? 'Pending' : 'Credit'}
              </span>
            </div>
          </div>
          {userRole === UserRole.RAVI && (
            <button 
              onClick={onLogPaymentClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[24px] text-base font-black shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-4 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-12 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Make Payment
            </button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="px-10 pb-8">
           <div className="flex justify-between items-end mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Progress</p>
              <p className="text-sm font-black text-slate-900">{percentCleared.toFixed(0)}% Clear</p>
           </div>
           <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${percentCleared === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${percentCleared}%` }}
              ></div>
           </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/60 divide-x divide-slate-100">
          <div className="p-8 group hover:bg-white transition-colors">
            <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mb-2 group-hover:text-rose-500 transition-colors">Total Project Cost</p>
            <p className="text-3xl font-black text-slate-900">Rs.{totalCosts.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">Rs.{recentCosts.toLocaleString()} in last 30 days</p>
          </div>
          <div className="p-8 group hover:bg-white transition-colors">
            <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Total Recovered</p>
            <p className="text-3xl font-black text-slate-900">Rs.{totalPaid.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">Rs.{recentPayments.toLocaleString()} in last 30 days</p>
          </div>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all">
          <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-emerald-600 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Latest Project Addition</p>
            <p className="text-lg font-black text-slate-900 truncate">{latestWork ? latestWork.description : 'No work logged'}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-black text-emerald-600">
                Rs.{(Number(latestWork?.amount) || 0) + (Number(latestWork?.extraCharges) || 0)}
              </p>
              {latestWork?.extraCharges ? <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">Incl. Rs.{latestWork.extraCharges} extras</span> : ''}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all">
          <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-600 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Latest Settlement Event</p>
            <p className="text-lg font-black text-slate-900 truncate">{latestPayment ? (latestPayment.note || latestPayment.method) : 'Awaiting payment'}</p>
            <p className="text-sm font-black text-indigo-600 mt-1">Rs.{latestPayment ? latestPayment.amount.toLocaleString() : '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
