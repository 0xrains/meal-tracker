import { Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { DaySummary, DAILY_ALLOWANCE, formatRupiah, todayStr } from '../lib/mealTracker';

interface WeeklySummaryProps {
    summaries: Record<string, DaySummary>;
    dailyAllowance?: number;
}

export function WeeklySummary({ summaries, dailyAllowance = DAILY_ALLOWANCE }: WeeklySummaryProps) {
    const today = new Date();
    const todayDateStr = todayStr();

    // Build last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const summary = summaries[dateStr];
        const isCurrentDay = dateStr === todayDateStr;
        const hasPast = date <= today;

        return {
            date,
            dateStr,
            dayLabel: format(date, 'EEE', { locale: id }),
            dayNum: format(date, 'd'),
            summary,
            isToday: isCurrentDay,
            hasPast,
            spent: summary?.spent ?? 0,
            isOver: summary ? summary.spent > dailyAllowance : false,
        };
    });

    // Compute totals for this week
    const weekTotal = days.reduce((sum, d) => sum + d.spent, 0);
    const weekBudget = days.filter(d => d.summary || d.isToday).length * dailyAllowance;
    const weekSaved = weekBudget - weekTotal;

    // Streak: consecutive days under budget ending today (going backwards)
    let streak = 0;
    const todayIdx = days.findIndex(d => d.isToday);
    for (let i = todayIdx; i >= 0; i--) {
        const d = days[i];
        if (d.summary && d.spent <= dailyAllowance) {
            streak++;
        } else if (d.summary && d.spent > dailyAllowance) {
            break;
        } else if (!d.summary && i === todayIdx) {
            // today with no spending counts
            streak++;
        } else {
            break;
        }
    }

    // Max spent this week for bar scaling
    const maxSpent = Math.max(...days.map(d => d.spent), dailyAllowance);

    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Ringkasan 7 Hari</h2>
                {streak > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                        <Flame className="h-3.5 w-3.5" />
                        {streak} hari hemat
                    </div>
                )}
            </div>

            {/* Day bars */}
            <div className="mb-5 flex items-end gap-1.5">
                {days.map(d => {
                    const barHeight = d.summary ? Math.max((d.spent / maxSpent) * 64, 4) : 4;
                    const budgetLineHeight = (DAILY_ALLOWANCE / maxSpent) * 64;

                    return (
                        <div key={d.dateStr} className="relative flex flex-1 flex-col items-center gap-1">
                            {/* Bar container */}
                            <div className="relative flex h-16 w-full items-end">
                                {/* Budget reference line */}
                                <div
                                    className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-emerald-300/60 dark:border-emerald-600/40"
                                    style={{ bottom: `${budgetLineHeight}px` }}
                                />

                                {/* Bar */}
                                <div
                                    className={`w-full rounded-t-md transition-all duration-500 ${!d.summary
                                            ? 'bg-muted'
                                            : d.isOver
                                                ? 'bg-rose-400 dark:bg-rose-500'
                                                : d.spent >= 25000
                                                    ? 'bg-amber-400 dark:bg-amber-500'
                                                    : 'bg-emerald-400 dark:bg-emerald-500'
                                        } ${d.isToday ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-card' : ''}`}
                                    style={{ height: `${barHeight}px` }}
                                />
                            </div>

                            {/* Day label */}
                            <div
                                className={`text-center text-xs font-medium ${d.isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'
                                    }`}
                            >
                                {d.dayLabel}
                            </div>
                            <div
                                className={`text-center text-xs ${d.isToday ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                                    }`}
                            >
                                {d.dayNum}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Weekly stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/60 dark:bg-muted/40 p-3 border border-border/50">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                        Total dipakai
                    </div>
                    <div className="font-mono text-sm font-bold text-foreground">
                        {formatRupiah(weekTotal)}
                    </div>
                    <div className="text-xs text-muted-foreground">dari {formatRupiah(weekBudget)}</div>
                </div>

                <div className="rounded-xl bg-muted/60 dark:bg-muted/40 p-3 border border-border/50">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingDown className={`h-3.5 w-3.5 ${weekSaved >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-400'}`} />
                        {weekSaved >= 0 ? 'Berhasil hemat' : 'Lebih pakai'}
                    </div>
                    <div
                        className={`font-mono text-sm font-bold ${weekSaved >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                            }`}
                    >
                        {weekSaved >= 0 ? '+' : ''}{formatRupiah(weekSaved)}
                    </div>
                    <div className="text-xs text-muted-foreground">minggu ini</div>
                </div>
            </div>
        </div>
    );
}
