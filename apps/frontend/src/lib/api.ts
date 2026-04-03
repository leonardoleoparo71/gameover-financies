const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 1
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as any) || {}),
  };

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(err.message || err.error || `Erro ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    // Retry on network errors
    if (retries > 0 && /Failed to fetch|NetworkError|fetch/i.test(error.message)) {
      await new Promise(r => setTimeout(r, 1000));
      return request(path, options, retries - 1);
    }
    throw error;
  }
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/auth/me'),
  updateProfile: (data: Partial<User>) =>
    request<{ user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Transactions
  getTransactions: (params?: { month?: number; year?: number }) => {
    const q = params ? `?month=${params.month}&year=${params.year}` : '';
    return request<Transaction[]>(`/transactions${q}`);
  },
  createTransaction: (data: Partial<Transaction>) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: Partial<Transaction>) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) =>
    request(`/transactions/${id}`, { method: 'DELETE' }),

  // Purchases
  getPurchases: () => request<FuturePurchase[]>('/purchases'),
  createPurchase: (data: Partial<FuturePurchase>) =>
    request<FuturePurchase>('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  updatePurchase: (id: string, data: Partial<FuturePurchase>) =>
    request<FuturePurchase>(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePurchase: (id: string) => request(`/purchases/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () => request<Goal[]>('/goals'),
  createGoal: (data: Partial<Goal>) =>
    request<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: string, data: Partial<Goal>) =>
    request<Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGoal: (id: string) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Snapshots
  getSnapshots: () => request<MonthlySnapshot[]>('/snapshots'),
  saveSnapshot: () => request<MonthlySnapshot>('/snapshots/save', { method: 'POST' }),

  // Summary
  getSummary: () => request<Summary>('/summary'),

  // Tree
  getTree: () => request<TreeNode[]>('/tree'),
  createNode: (data: Partial<TreeNode>) =>
    request<TreeNode>('/tree', { method: 'POST', body: JSON.stringify(data) }),
  updateNode: (id: string, data: Partial<TreeNode>) =>
    request<TreeNode>(`/tree/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNode: (id: string) => request(`/tree/${id}`, { method: 'DELETE' }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  salary: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: 'essential' | 'leisure' | 'investment' | 'future_purchase';
  name: string;
  amount: number;
  date: string;
}

export interface FuturePurchase {
  id: string;
  userId: string;
  name: string;
  description?: string;
  value: number;
  link?: string;
  imageUrl?: string;
  purchased: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetValue: number;
  deadline?: string;
  createdAt: string;
}

export interface MonthlySnapshot {
  id: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
}

export interface Summary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  saved: number;
  savingsRate: number;
  spendRate: number;
  totalPurchasesCost: number;
  insights: string[];
}

export interface TreeNode {
  id: string;
  userId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status: 'pending' | 'in_progress' | 'done';
  color?: string;
  date?: string;
  parentId?: string;
  positionX: number;
  positionY: number;
}
