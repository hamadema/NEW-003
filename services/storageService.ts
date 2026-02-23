
import { DesignCost, Payment, QuickButton } from '../types';

const KEYS = {
  COSTS: 'ledger_design_costs',
  PAYMENTS: 'ledger_payments',
  SETTINGS: 'ledger_settings',
  GAS_URL: 'ledger_gas_url'
};

const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbyb9fsCsTGsgt362lu4sKmIACf9SuyU_vLUDsXoJx6IvGnZHkdKnfCmk1D68cZevJXSgg/exec";

const DEFAULT_BUTTONS: QuickButton[] = [
  { id: '1', label: 'Photo Retouch', amount: 300, type: 'Retouch' },
  { id: '2', label: 'Logo Design', amount: 1500, type: 'Branding' },
  { id: '3', label: 'Social Post', amount: 500, type: 'Social' },
  { id: '4', label: 'UI Mockup', amount: 2500, type: 'UX' }
];

const parseSafeAmount = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const sanitizeRemoteItems = (items: any[]) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    const raw = item as any;
    const amount = parseSafeAmount(raw.amount);
    const extraCharges = parseSafeAmount(raw.extraCharges);
    const addedBy = raw.addedBy || raw.addedby || raw.user || 'User';
    
    const description = raw.description || raw.desc || raw.work || raw.note || raw.item || 'New Entry';
    const note = raw.note || raw.description || raw.desc || 'Log Entry';
    const date = raw.date || new Date().toISOString();
    
    // Create a stable ID if none exists to prevent deselection on refresh
    const stableId = raw.id || `${date}-${amount}-${description}`.replace(/\s+/g, '-');

    return {
      ...raw,
      id: stableId,
      date,
      amount,
      extraCharges,
      addedBy,
      description,
      note,
      type: raw.type || 'General',
      method: raw.method || 'GPay'
    };
  });
};

export const storageService = {
  getGasUrl: (): string => localStorage.getItem(KEYS.GAS_URL) || DEFAULT_GAS_URL,
  setGasUrl: (url: string) => localStorage.setItem(KEYS.GAS_URL, url),

  getCosts: async (): Promise<DesignCost[]> => {
    const gasUrl = storageService.getGasUrl();
    if (gasUrl) {
      try {
        const res = await fetch(gasUrl, { method: 'GET', cache: 'no-store' });
        const data = await res.json();
        return sanitizeRemoteItems(data.costs || []);
      } catch (e) {
        console.warn("Sync failed, check GAS URL", e);
      }
    }
    const data = localStorage.getItem(KEYS.COSTS);
    return data ? sanitizeRemoteItems(JSON.parse(data)) : [];
  },

  saveCost: async (cost: DesignCost, userEmail: string) => {
    const gasUrl = storageService.getGasUrl();
    const payload = { ...cost, entryType: 'COST', userEmail, action: 'ADD' };
    
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
      } catch (e) { console.error("Save failed", e); }
    }
    const costs = JSON.parse(localStorage.getItem(KEYS.COSTS) || '[]');
    costs.push(cost);
    localStorage.setItem(KEYS.COSTS, JSON.stringify(costs));
  },

  deleteEntry: async (id: string, entryType: 'COST' | 'PAYMENT') => {
    const gasUrl = storageService.getGasUrl();
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ id, entryType, action: 'DELETE' })
        });
      } catch (e) { console.error("Delete failed", e); }
    }
    const key = entryType === 'COST' ? KEYS.COSTS : KEYS.PAYMENTS;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = items.filter((i: any) => i.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  getPayments: async (): Promise<Payment[]> => {
    const gasUrl = storageService.getGasUrl();
    if (gasUrl) {
      try {
        const res = await fetch(gasUrl, { method: 'GET', cache: 'no-store' });
        const data = await res.json();
        return sanitizeRemoteItems(data.payments || []);
      } catch (e) { console.warn("Sync failed", e); }
    }
    const data = localStorage.getItem(KEYS.PAYMENTS);
    return data ? sanitizeRemoteItems(JSON.parse(data)) : [];
  },

  savePayment: async (payment: Payment, userEmail: string) => {
    const gasUrl = storageService.getGasUrl();
    const payload = { ...payment, entryType: 'PAYMENT', userEmail, action: 'ADD' };
    
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
      } catch (e) { console.error("Save failed", e); }
    }
    const payments = JSON.parse(localStorage.getItem(KEYS.PAYMENTS) || '[]');
    payments.push(payment);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
  },

  getQuickButtons: (): QuickButton[] => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_BUTTONS;
  },
  
  saveQuickButtons: (buttons: QuickButton[]) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(buttons));
  }
};
