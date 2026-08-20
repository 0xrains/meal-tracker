import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { OperationResult } from './useTransactions';

export const DEFAULT_FUNDING_SOURCES = ['Dompet', 'ShopeePay', 'Seabank', 'Gopay', 'Dana', 'BRI'];

export function useFundingSources(userId?: string | null) {
    const [sources, setSources] = useState<string[]>(DEFAULT_FUNDING_SOURCES);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSources = useCallback(async () => {
        if (userId === null) {
            setSources(DEFAULT_FUNDING_SOURCES);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('funding_sources')
                .select('name')
                .order('created_at', { ascending: true });

            if (error) {
                console.warn('Could not fetch funding sources from database:', error.message);
                return;
            }

            if (data && data.length > 0) {
                const names = data.map(item => item.name);
                const merged = Array.from(new Set([...DEFAULT_FUNDING_SOURCES, ...names]));
                setSources(merged);
            } else {
                setSources(DEFAULT_FUNDING_SOURCES);
            }
        } catch (err) {
            console.error('Error fetching funding sources:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchSources();
    }, [fetchSources]);

    const addFundingSource = useCallback(async (name: string): Promise<OperationResult> => {
        const trimmed = name.trim();
        if (!trimmed) {
            return { success: false, error: 'Nama sumber dana tidak boleh kosong' };
        }

        // Optimistic update
        setSources(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));

        try {
            const { error } = await supabase
                .from('funding_sources')
                .insert([{ name: trimmed }]);

            if (error) {
                // If duplicate or table issue
                if (error.code === '23505') {
                    // unique constraint violation -> already exists, treat as success
                    return { success: true };
                }
                console.error('Error saving funding source to DB:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err: unknown) {
            console.error('Error adding funding source:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Gagal menyimpan sumber dana ke database',
            };
        }
    }, []);

    return { sources, isLoading, addFundingSource, refetchSources: fetchSources };
}
