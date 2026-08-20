import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DAILY_ALLOWANCE } from '../lib/mealTracker';
import { OperationResult } from './useTransactions';

const STORAGE_KEY = 'meal_tracker_daily_budget';

export function useAppSettings(userId?: string | null) {
    const [dailyBudget, setDailyBudget] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = Number(saved);
                if (!isNaN(parsed) && parsed > 0) return parsed;
            }
        } catch {
            // fallback
        }
        return DAILY_ALLOWANCE;
    });

    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    // Fetch settings from Supabase 'app_settings'
    const fetchSettings = useCallback(async () => {
        if (userId === null) {
            setDailyBudget(DAILY_ALLOWANCE);
            setIsLoadingSettings(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('key, value')
                .eq('key', 'daily_budget')
                .maybeSingle();

            if (error) {
                console.warn('Could not fetch app_settings from Supabase:', error.message);
                return;
            }

            if (data && data.value) {
                const val = typeof data.value === 'number' ? data.value : Number(data.value);
                if (!isNaN(val) && val > 0) {
                    setDailyBudget(val);
                    try {
                        localStorage.setItem(STORAGE_KEY, String(val));
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        } catch (err) {
            console.error('Fetch settings error:', err);
        } finally {
            setIsLoadingSettings(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Update daily budget in Supabase & local state
    const updateDailyBudget = async (newBudget: number): Promise<OperationResult> => {
        if (isNaN(newBudget) || newBudget <= 0) {
            return { success: false, error: 'Anggaran harian harus berupa angka lebih dari 0' };
        }

        const prevBudget = dailyBudget;
        // Optimistic update
        setDailyBudget(newBudget);
        try {
            localStorage.setItem(STORAGE_KEY, String(newBudget));
        } catch (e) {
            console.error(e);
        }

        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({ key: 'daily_budget', value: newBudget, updated_at: new Date().toISOString() });

            if (error) {
                console.error('Supabase update settings error:', error);
                // Rollback on network/DB error
                setDailyBudget(prevBudget);
                try {
                    localStorage.setItem(STORAGE_KEY, String(prevBudget));
                } catch (e) {
                    console.error(e);
                }
                return {
                    success: false,
                    error: `Gagal menyimpan ke database (${error.message}). Pastikan tabel app_settings sudah dibuat di Supabase.`,
                };
            }

            return { success: true };
        } catch (err: unknown) {
            setDailyBudget(prevBudget);
            try {
                localStorage.setItem(STORAGE_KEY, String(prevBudget));
            } catch (e) {
                console.error(e);
            }
            const msg = err instanceof Error ? err.message : 'Kesalahan jaringan';
            return { success: false, error: `Gagal menyimpan: ${msg}` };
        }
    };

    return {
        dailyBudget,
        isLoadingSettings,
        updateDailyBudget,
        refetchSettings: fetchSettings,
    };
}
