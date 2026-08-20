import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '../types';
import { supabase } from '../lib/supabase';

export interface OperationResult {
    success: boolean;
    error?: string;
}

function parseErrorMessage(err: unknown): string {
    if (!err) return 'Terjadi kesalahan tidak terduga.';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        const msg = (err as { message: string }).message;
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
            return 'Gagal terhubung ke jaringan. Periksa koneksi internet Anda.';
        }
        return msg;
    }
    return 'Terjadi kesalahan pada sistem.';
}

export function useTransactions(userId?: string | null) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        if (userId === null) {
            setTransactions([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('timestamp', { ascending: true });

            if (error) throw error;

            if (data) {
                // Ensure data is sorted as expected
                const sorted = data.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
                setTransactions(sorted);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setFetchError(parseErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>): Promise<OperationResult> => {
        const tempId = 'temp-' + Date.now().toString() + Math.random().toString(36).substring(2);
        const newT: Transaction = { ...t, id: tempId };

        // Optimistic update
        setTransactions(prev => {
            return [...prev, newT].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        });

        try {
            const { data, error } = await supabase
                .from('transactions')
                .insert([t])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // Replace optimistic task with the real one returned from DB
                setTransactions(prev => {
                    return prev
                        .map(item => item.id === tempId ? data as Transaction : item)
                        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
                });
            }
            return { success: true };
        } catch (error) {
            console.error('Error adding transaction:', error);
            // Rollback optimistic update
            setTransactions(prev => prev.filter(item => item.id !== tempId));
            return { success: false, error: parseErrorMessage(error) };
        }
    }, []);

    const updateTransaction = useCallback(async (id: string, updates: Partial<Omit<Transaction, 'id'>>): Promise<OperationResult> => {
        // Keep copy of previous transactions for precision rollback
        let previousTransactions: Transaction[] = [];
        setTransactions(prev => {
            previousTransactions = prev;
            return prev
                .map(t => (t.id === id ? { ...t, ...updates } : t))
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        });

        try {
            const { error } = await supabase
                .from('transactions')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating transaction:', error);
            // Revert changes on error
            setTransactions(previousTransactions);
            return { success: false, error: parseErrorMessage(error) };
        }
    }, []);

    const deleteTransaction = useCallback(async (id: string): Promise<OperationResult> => {
        let deletedItem: Transaction | undefined;
        setTransactions(prev => {
            deletedItem = prev.find(t => t.id === id);
            return prev.filter(t => t.id !== id);
        });

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting transaction:', error);
            // Restore deleted item on failure
            if (deletedItem) {
                const itemToRestore = deletedItem;
                setTransactions(prev => [...prev, itemToRestore].sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
            }
            return { success: false, error: parseErrorMessage(error) };
        }
    }, []);

    return {
        transactions,
        isLoading,
        fetchError,
        refetch: fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
    };
}

