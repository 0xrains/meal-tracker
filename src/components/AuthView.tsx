import { useState } from 'react';
import { ChefHat, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { OperationResult } from '../hooks/useTransactions';

interface AuthViewProps {
    onSignIn: (email: string, pass: string) => Promise<OperationResult>;
    onSignUp: (email: string, pass: string) => Promise<OperationResult>;
}

export function AuthView({ onSignIn, onSignUp }: AuthViewProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!email.trim() || !password) {
            setErrorMsg('Mohon isi alamat email dan kata sandi.');
            return;
        }

        if (isRegister) {
            if (password.length < 6) {
                setErrorMsg('Kata sandi minimal harus 6 karakter.');
                return;
            }
            if (password !== confirmPassword) {
                setErrorMsg('Konfirmasi kata sandi tidak cocok.');
                return;
            }
        }

        setIsLoading(true);
        try {
            if (isRegister) {
                const res = await onSignUp(email, password);
                if (res.success) {
                    if (res.error) {
                        toast(res.error, { icon: '📧', duration: 5000 });
                    } else {
                        toast.success('Pendaftaran berhasil! Selamat datang 🎉');
                    }
                } else {
                    setErrorMsg(res.error || 'Gagal mendaftar.');
                }
            } else {
                const res = await onSignIn(email, password);
                if (res.success) {
                    toast.success('Berhasil masuk!');
                } else {
                    setErrorMsg(res.error || 'Gagal masuk.');
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground transition-colors duration-200">
            <div className="w-full max-w-md space-y-6">
                {/* Header Brand */}
                <div className="text-center space-y-2">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20 animate-fade-in">
                        <ChefHat className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                        Catatan Makan
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Pencatat pengeluaran makan harian dengan saldo akumulasi & statistik pintar
                    </p>
                </div>

                {/* Auth Card */}
                <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl animate-fade-in">
                    {/* Tab Switcher */}
                    <div className="mb-6 flex rounded-xl bg-muted/60 p-1">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(false);
                                setErrorMsg(null);
                            }}
                            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${!isRegister
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(true);
                                setErrorMsg(null);
                            }}
                            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${isRegister
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Daftar Akun Baru
                        </button>
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                            <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground">
                                Alamat Email <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    disabled={isLoading}
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-foreground">
                                Kata Sandi <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={isLoading}
                                    placeholder="Minimal 6 karakter"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    disabled={isLoading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password (only on Register) */}
                        {isRegister && (
                            <div className="animate-fade-in">
                                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                                    Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        disabled={isLoading}
                                        placeholder="Ketik ulang kata sandi"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span>{isRegister ? 'Buat Akun Sekarang' : 'Masuk ke Akun'}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle footer */}
                    <div className="mt-5 text-center text-xs text-muted-foreground">
                        {isRegister ? (
                            <span>
                                Sudah punya akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegister(false);
                                        setErrorMsg(null);
                                    }}
                                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                    Masuk di sini
                                </button>
                            </span>
                        ) : (
                            <span>
                                Belum punya akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegister(true);
                                        setErrorMsg(null);
                                    }}
                                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                    Daftar sekarang
                                </button>
                            </span>
                        )}
                    </div>
                </div>

                {/* Features Highlights */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground pt-2">
                    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border/50 bg-card/60 p-3">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-[11px]">100% Data Privat</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border/50 bg-card/60 p-3">
                        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-[11px]">Akumulasi Saldo</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border/50 bg-card/60 p-3">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-[11px]">Rekap Bulanan</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
