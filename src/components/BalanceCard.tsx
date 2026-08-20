import { Wallet, TrendingUp, TrendingDown, Utensils } from 'lucide-react';
import { DAILY_ALLOWANCE, formatRupiah } from '../lib/mealTracker';

interface BalanceCardProps {
    availableBalance: number;
    spentToday: number;
    todayAllowance: number;
    yesterdayBalance: number;
    dailyAllowance?: number;
}

export function BalanceCard({
    availableBalance,
    spentToday,
    todayAllowance,
    yesterdayBalance,
    dailyAllowance = DAILY_ALLOWANCE,
}: BalanceCardProps) {
    const isNegative = availableBalance < 0;
    const warningThreshold = dailyAllowance * 0.8;
    const isWarning = spentToday >= warningThreshold && spentToday <= dailyAllowance;
    const isOverBudget = spentToday > dailyAllowance;

    // Progress bar: percentage of dailyAllowance spent
    const progressPct = Math.min((spentToday / dailyAllowance) * 100, 100);

    const progressColor = isOverBudget
        ? 'bg-rose-500'
        : isWarning
            ? 'bg-amber-400'
            : 'bg-emerald-400';

    const gradientClass = isNegative
        ? 'from-rose-500 to-rose-600'
        : 'from-emerald-500 to-emerald-600';

    return (
        <div className={`relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br ${gradientClass} p-6 text-white animate-fade-in`}>
            {/* Background decoration */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/10" />

            {/* Header */}
            <div className="relative mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Wallet className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-white/90">Anggaran Makan Hari Ini</span>
            </div>

            {/* Main balance */}
            <div className="relative mb-5 text-center">
                <div className="font-mono text-5xl font-bold tracking-tight">
                    {formatRupiah(availableBalance)}
                </div>
                {isNegative && (
                    <div className="mt-1 text-xs text-white/80">
                        ⚠️ Kamu boros kemarin, saldo dikurangi hari ini
                    </div>
                )}
                <div className="mt-1 text-xs text-white/70">
                    Jatah harian: {formatRupiah(todayAllowance)}
                </div>
            </div>

            {/* Stats pills */}
            <div className="relative mb-4 flex gap-3">
                {/* Terpakai */}
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <Utensils className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs text-white/70">Terpakai</div>
                        <div className="font-mono text-sm font-semibold leading-tight">
                            {formatRupiah(spentToday)}
                        </div>
                    </div>
                </div>

                {/* Bonus kemarin */}
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                        {yesterdayBalance >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs text-white/70">Sisa Kemarin</div>
                        <div className="font-mono text-sm font-semibold leading-tight">
                            {yesterdayBalance >= 0 ? '+' : ''}
                            {formatRupiah(yesterdayBalance)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative">
                <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                    <span>Pengeluaran hari ini</span>
                    <span>
                        {Math.round(progressPct)}%{isOverBudget && ' (over!)'}
                    </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <div className="mt-1 flex justify-between text-xs text-white/60">
                    <span>Rp0</span>
                    <span>Rp30.000</span>
                </div>
            </div>
        </div>
    );
}
