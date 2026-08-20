import { useState, useMemo, useEffect } from 'react';
import { Home, List, BarChart2, Plus, ChefHat, AlertCircle, RefreshCw, Moon, Sun, Settings, LogOut, User as UserIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { useTransactions, OperationResult } from './hooks/useTransactions';
import { useAppSettings } from './hooks/useAppSettings';
import { buildDailySummaries, getTodayBalance } from './lib/mealTracker';
import { BalanceCard } from './components/BalanceCard';
import { AddTransactionForm } from './components/AddTransactionForm';
import { HistoryList } from './components/HistoryList';
import { WeeklySummary } from './components/WeeklySummary';
import { MonthlySummary } from './components/MonthlySummary';
import { SettingsModal } from './components/SettingsModal';
import { AuthView } from './components/AuthView';
import { Transaction } from './types';

type Tab = 'dashboard' | 'riwayat' | 'rekap';

export default function App() {
    const { user, isLoadingAuth, signInWithEmail, signUpWithEmail, signOut } = useAuth();

    const {
        transactions,
        isLoading,
        fetchError,
        refetch,
        addTransaction,
        updateTransaction,
        deleteTransaction,
    } = useTransactions(user?.id);

    const { dailyBudget, updateDailyBudget } = useAppSettings(user?.id);

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Theme state: defaults to 'light'
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        try {
            const saved = localStorage.getItem('meal_tracker_theme');
            return saved === 'dark' ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        try {
            localStorage.setItem('meal_tracker_theme', theme);
        } catch (err) {
            console.error(err);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    // Calculate summaries and today's balance using dynamic dailyBudget
    const summaries = useMemo(
        () => buildDailySummaries(transactions, dailyBudget),
        [transactions, dailyBudget]
    );
    const todayBalance = useMemo(
        () => getTodayBalance(transactions, dailyBudget),
        [transactions, dailyBudget]
    );

    async function handleSave(data: Omit<Transaction, 'id'>): Promise<OperationResult> {
        let res: OperationResult;
        if (editingTransaction) {
            res = await updateTransaction(editingTransaction.id, data);
            if (res.success) {
                toast.success('Pengeluaran berhasil diperbarui ✨');
                setEditingTransaction(null);
            } else {
                toast.error(res.error || 'Gagal mengedit pengeluaran');
            }
        } else {
            res = await addTransaction(data);
            if (res.success) {
                toast.success('Pengeluaran berhasil dicatat! 🍜');
                setShowAddForm(false);
            } else {
                toast.error(res.error || 'Gagal menambahkan pengeluaran');
            }
        }
        return res;
    }

    async function handleSaveBudget(newBudget: number): Promise<OperationResult> {
        const res = await updateDailyBudget(newBudget);
        if (res.success) {
            toast.success(`Target anggaran diubah jadi Rp${newBudget.toLocaleString('id-ID')} ✨`);
        }
        return res;
    }

    async function handleSignOut() {
        const res = await signOut();
        if (res.success) {
            toast.success('Berhasil keluar dari akun 👋');
        } else {
            toast.error(res.error || 'Gagal keluar');
        }
    }

    function handleEdit(id: string) {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            setEditingTransaction(tx);
            setActiveTab('riwayat');
        }
    }

    async function handleDelete(id: string) {
        const res = await deleteTransaction(id);
        if (res.success) {
            toast.success('Catatan berhasil dihapus');
        } else {
            toast.error(res.error || 'Gagal menghapus catatan');
        }
    }

    function handleCloseForm() {
        setShowAddForm(false);
        setEditingTransaction(null);
    }

    const isFormOpen = showAddForm || editingTransaction !== null;

    // 1. Loading Auth state
    if (isLoadingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    <p className="text-xs font-semibold text-muted-foreground animate-pulse">Memuat akun...</p>
                </div>
            </div>
        );
    }

    // 2. Unauthenticated state -> Show AuthView
    if (!user) {
        return (
            <>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 3500,
                        style: {
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: 600,
                            padding: '12px 18px',
                            boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.25)',
                        },
                        success: {
                            style: { background: '#059669', color: '#ffffff' },
                            iconTheme: { primary: '#ffffff', secondary: '#059669' },
                        },
                        error: {
                            style: { background: '#e11d48', color: '#ffffff' },
                            iconTheme: { primary: '#ffffff', secondary: '#e11d48' },
                        },
                    }}
                />
                <AuthView onSignIn={signInWithEmail} onSignUp={signUpWithEmail} />
            </>
        );
    }

    // 3. Authenticated state -> Main App
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3500,
                    style: {
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: 600,
                        padding: '12px 18px',
                        boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.25)',
                    },
                    success: {
                        style: {
                            background: '#059669',
                            color: '#ffffff',
                            border: '1px solid #047857',
                        },
                        iconTheme: {
                            primary: '#ffffff',
                            secondary: '#059669',
                        },
                    },
                    error: {
                        style: {
                            background: '#e11d48',
                            color: '#ffffff',
                            border: '1px solid #be123c',
                        },
                        iconTheme: {
                            primary: '#ffffff',
                            secondary: '#e11d48',
                        },
                    },
                }}
            />

            {/* App container */}
            <div className="mx-auto max-w-md min-h-screen flex flex-col relative">
                {/* Top header */}
                <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-sm px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow-xs">
                                <ChefHat className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-bold text-foreground leading-tight truncate">Catatan Makan</h1>
                                <p className="text-[10px] text-muted-foreground truncate" title={user.email || ''}>
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {/* Action buttons: Settings, Theme Toggle, and Logout */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-xs transition-all hover:bg-muted active:scale-90"
                                aria-label="Pengaturan Anggaran"
                                title="Pengaturan Anggaran"
                            >
                                <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>

                            <button
                                onClick={toggleTheme}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-xs transition-all hover:bg-muted active:scale-90"
                                aria-label={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-4 w-4 text-amber-400 animate-fade-in" />
                                ) : (
                                    <Moon className="h-4 w-4 text-muted-foreground hover:text-foreground animate-fade-in" />
                                )}
                            </button>

                            <button
                                onClick={handleSignOut}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs transition-all hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/60 active:scale-90"
                                aria-label="Keluar dari Akun"
                                title="Keluar dari Akun"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto px-4 pt-4 pb-36">
                    {isLoading ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-4">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">Menghubungkan ke database...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="my-8 flex flex-col items-center justify-center rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 p-6 text-center shadow-sm">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h3 className="mb-1 text-base font-semibold text-rose-800 dark:text-rose-300">Gagal Memuat Data</h3>
                            <p className="mb-4 text-xs text-rose-600 dark:text-rose-400 max-w-xs">{fetchError}</p>
                            <button
                                onClick={() => refetch()}
                                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:bg-rose-700 active:scale-95"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Coba Lagi</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Dashboard Tab */}
                            {activeTab === 'dashboard' && (
                                <div className="space-y-4">
                                    <BalanceCard
                                        availableBalance={todayBalance.availableBalance}
                                        spentToday={todayBalance.spentToday}
                                        todayAllowance={todayBalance.todayAllowance}
                                        yesterdayBalance={todayBalance.yesterdayBalance}
                                        dailyAllowance={dailyBudget}
                                    />
                                    <WeeklySummary summaries={summaries} dailyAllowance={dailyBudget} />

                                    {/* Quick tips */}
                                    {transactions.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 text-center">
                                            <div className="mb-2 text-2xl">🍜</div>
                                            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Mulai catat pengeluaranmu!</div>
                                            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                Tekan tombol <strong>+</strong> di bawah untuk menambahkan pengeluaran pertama
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent transactions on dashboard */}
                                    {transactions.length > 0 && (
                                        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                                            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                                                <h2 className="text-sm font-semibold text-foreground">Pengeluaran Hari Ini</h2>
                                                <button
                                                    onClick={() => setActiveTab('riwayat')}
                                                    className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                                >
                                                    Lihat semua →
                                                </button>
                                            </div>
                                            {(() => {
                                                const d = new Date();
                                                const todayDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                const todayTxs = transactions
                                                    .filter(t => t.timestamp.startsWith(todayDate))
                                                    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

                                                if (todayTxs.length === 0) {
                                                    return (
                                                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                                            Belum ada pengeluaran hari ini 🙌
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="divide-y divide-border">
                                                        {todayTxs.slice(0, 4).map(tx => (
                                                             <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                                                                 <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                                                 <div className="flex-1 min-w-0 flex items-center gap-2">
                                                                     <span className="truncate text-sm text-foreground">{tx.item}</span>
                                                                     <span className="shrink-0 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                                                         {tx.source || 'Dompet'}
                                                                     </span>
                                                                 </div>
                                                                 <span className="font-mono text-sm font-semibold text-foreground">
                                                                     Rp{tx.amount.toLocaleString('id-ID')}
                                                                 </span>
                                                             </div>
                                                         ))}
                                                        {todayTxs.length > 4 && (
                                                            <div className="px-4 py-2.5 text-center text-xs text-muted-foreground">
                                                                +{todayTxs.length - 4} lagi...
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Riwayat Tab */}
                            {activeTab === 'riwayat' && (
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-foreground">Riwayat Pengeluaran</h2>
                                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                            {transactions.length} catatan
                                        </span>
                                    </div>
                                    <HistoryList
                                        transactions={transactions}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        summaries={summaries}
                                    />
                                </div>
                            )}

                            {/* Rekap Tab */}
                            {activeTab === 'rekap' && (
                                <div>
                                    <MonthlySummary summaries={summaries} dailyAllowance={dailyBudget} />
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Floating Add Button — only on dashboard and history */}
                {!isLoading && (activeTab === 'dashboard' || activeTab === 'riwayat') && !isFormOpen && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all hover:bg-emerald-700 hover:scale-105 active:scale-95"
                        style={{ maxWidth: 'calc(448px + 0px)', right: 'max(16px, calc(50% - 208px + 16px))' }}
                        aria-label="Tambah pengeluaran"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                )}

                {/* Bottom Tab Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-md items-center">
                        {(
                            [
                                { id: 'dashboard', label: 'Dashboard', icon: Home },
                                { id: 'riwayat', label: 'Riwayat', icon: List },
                                { id: 'rekap', label: 'Rekap', icon: BarChart2 },
                            ] as { id: Tab; label: string; icon: React.ElementType }[]
                        ).map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${activeTab === id
                                    ? 'text-emerald-600'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon
                                    className={`h-5 w-5 transition-all ${activeTab === id ? 'scale-110' : ''
                                        }`}
                                />
                                <span>{label}</span>
                                {activeTab === id && (
                                    <div className="absolute bottom-0 h-0.5 w-10 rounded-full bg-emerald-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Form Modal Overlay */}
                {isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-foreground/40 animate-modal-in backdrop-blur-sm"
                            onClick={handleCloseForm}
                        />
                        {/* Form dialog panel */}
                        <div className="relative z-10 w-full max-w-md">
                            <AddTransactionForm
                                onSave={handleSave}
                                onCancel={handleCloseForm}
                                initialValues={editingTransaction ?? undefined}
                            />
                        </div>
                    </div>
                )}

                {/* Settings Modal Overlay */}
                <SettingsModal
                    isOpen={isSettingsOpen}
                    currentBudget={dailyBudget}
                    onSave={handleSaveBudget}
                    onClose={() => setIsSettingsOpen(false)}
                />
            </div>
        </div>
    );
}

