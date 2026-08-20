import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { OperationResult } from './useTransactions';

export function parseAuthErrorMessage(error: AuthError): string {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials')) {
        return 'Email atau kata sandi yang kamu masukkan salah.';
    }
    if (msg.includes('user already registered') || msg.includes('email already in use')) {
        return 'Email ini sudah terdaftar. Silakan langsung masuk (login).';
    }
    if (msg.includes('password should be at least 6 characters')) {
        return 'Kata sandi minimal harus 6 karakter.';
    }
    if (msg.includes('invalid email') || msg.includes('unable to validate email address')) {
        return 'Format alamat email tidak valid.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
        return 'Terlalu banyak percobaan. Harap tunggu beberapa saat lagi.';
    }
    return error.message || 'Terjadi kesalahan pada proses autentikasi.';
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoadingAuth(false);
        });

        // Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoadingAuth(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signInWithEmail = async (email: string, password: string): Promise<OperationResult> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                return { success: false, error: parseAuthErrorMessage(error) };
            }
            return { success: true };
        } catch (err: unknown) {
            console.error('Sign in error:', err);
            return { success: false, error: 'Gagal menghubungkan ke server autentikasi.' };
        }
    };

    const signUpWithEmail = async (email: string, password: string): Promise<OperationResult> => {
        try {
            const { error, data } = await supabase.auth.signUp({
                email: email.trim(),
                password,
            });

            if (error) {
                return { success: false, error: parseAuthErrorMessage(error) };
            }

            // In Supabase, if email confirmation is enabled, session might be null initially
            if (data.user && !data.session) {
                return {
                    success: true,
                    error: 'Akun berhasil dibuat! Silakan periksa inbox email untuk konfirmasi atau langsung masuk.',
                };
            }

            return { success: true };
        } catch (err: unknown) {
            console.error('Sign up error:', err);
            return { success: false, error: 'Gagal membuat akun baru.' };
        }
    };

    const signOut = async (): Promise<OperationResult> => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (err: unknown) {
            console.error('Sign out error:', err);
            return { success: false, error: 'Gagal keluar dari akun.' };
        }
    };

    return {
        user,
        session,
        isLoadingAuth,
        signInWithEmail,
        signUpWithEmail,
        signOut,
    };
}
