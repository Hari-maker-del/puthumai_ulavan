/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addExpense, deleteExpense, getExpenses, updateExpense } from '@/services/expenseService';
import { subscribeToTable, type RealtimeStatus } from '@/services/realtimeService';
import type { AddExpenseRequest, ExpenseRow } from '@/services/types';

interface ExpenseContextValue {
  expenses: ExpenseRow[];
  loading: boolean;
  error: string | null;
  refreshExpenses: () => Promise<void>;
  createExpense: (payload: AddExpenseRequest) => Promise<ExpenseRow>;
  updateExpenseItem: (id: string, payload: AddExpenseRequest) => Promise<ExpenseRow>;
  deleteExpenseItem: (id: string) => Promise<void>;
  realtimeStatus: RealtimeStatus;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('DISABLED');

  const refreshExpenses = useCallback(async () => {
    if (!user?.id) {
      setExpenses([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getExpenses(user.id);
      setExpenses(response.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load expenses');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshExpenses();
  }, [refreshExpenses]);

  useEffect(() => {
    if (!user?.id) {
      setRealtimeStatus('DISABLED');
      return;
    }

    const subscription = subscribeToTable({
      table: 'expenses',
      filter: `user_id=eq.${user.id}`,
      onStatus: setRealtimeStatus,
      onChange: (payload) => {
        const row = payload.new as Partial<ExpenseRow> & Record<string, unknown>;
        const oldRow = payload.old as Partial<ExpenseRow> & Record<string, unknown>;

        if (payload.eventType === 'INSERT') {
          void refreshExpenses();
        } else if (payload.eventType === 'UPDATE') {
          void refreshExpenses();
        } else if (payload.eventType === 'DELETE') {
          setExpenses(current => current.filter(item => item.id !== String(oldRow.id ?? '')));
        } else if (row.id) {
          void refreshExpenses();
        }
      },
    });

    return () => { void subscription.unsubscribe(); };
  }, [user?.id, refreshExpenses]);

  const createExpense = useCallback(async (payload: AddExpenseRequest) => {
    const response = await addExpense({ ...payload, user_id: user?.id });
    setExpenses((current) => [response.expense, ...current]);
    return response.expense;
  }, [user?.id]);

  const updateExpenseItem = useCallback(async (id: string, payload: AddExpenseRequest) => {
    const updated = await updateExpense(id, { ...payload, user_id: user?.id });
    setExpenses((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [user?.id]);

  const deleteExpenseItem = useCallback(async (id: string) => {
    await deleteExpense(id);
    setExpenses((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<ExpenseContextValue>(
    () => ({
      expenses,
      loading,
      error,
      refreshExpenses,
      createExpense,
      updateExpenseItem,
      deleteExpenseItem,
      realtimeStatus,
    }),
    [createExpense, deleteExpenseItem, error, expenses, loading, refreshExpenses, updateExpenseItem, realtimeStatus],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpensesContext() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpensesContext must be used within ExpenseProvider');
  return ctx;
}
