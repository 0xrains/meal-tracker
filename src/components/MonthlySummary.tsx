import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
} from 'recharts';
import { format, getDaysInMonth, parseISO, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { TrendingDown, TrendingUp, CalendarDays, PiggyBank } from 'lucide-react';
import { DaySummary, DAILY_ALLOWANCE, formatRupiah, todayStr } from '../lib/mealTracker';

interface MonthlySummaryProps {
    summaries: Record<string, DaySummary>;
    dailyAllowance?: number;
}

interface ChartDataPoint {
    day: number;
    spent: number;
    allowance: number;
}

function formatRupiahShort(value: number): string {
    if (value >= 1000) return `${Math.round(value / 1000)}rb`;
    return `${value}`;
}

export function MonthlySummary({ summaries, dailyAllowance = DAILY_ALLOWANCE }: MonthlySummaryProps) {
    const today = new Date();
    const todayStr2 = todayStr();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthStart = startOfMonth(today);
    const daysInMonth = getDaysInMonth(today);
    const dayOfMonth = today.getDate();

    // Build chart data for current month
    const chartData: ChartDataPoint[] = [];
    let monthTotal = 0;
    let daysWithData = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const summary = summaries[dateStr];

        if (date > today) break; // don't show future days

        const spent = summary?.spent ?? 0;
        monthTotal += spent;
        if (summary) daysWithData++;

        chartData.push({
            day: d,
            spent,
            allowance: dailyAllowance,
        });
    }

    const monthBudget = dayOfMonth * dailyAllowance;
    const monthSaved = monthBudget - monthTotal;
    const efficiencyPct =
        monthBudget > 0 ? Math.abs((monthSaved / monthBudget) * 100).toFixed(1) : '0';
    const isEfficient = monthSaved >= 0;

    const monthName = format(monthStart, 'MMMM yyyy', { locale: id });

    // Days over budget this month
    const daysOver = chartData.filter(d => d.spent > dailyAllowance).length;
    const daysUnder = chartData.filter(d => d.spent > 0 && d.spent <= dailyAllowance).length;

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Month header */}
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                    <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-foreground capitalize">Rekap {monthName}</h2>
                    <p className="text-xs text-muted-foreground">
                        {dayOfMonth} dari {daysInMonth} hari
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Total budget */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-1 text-xs text-muted-foreground">Total Jatah Bulan Ini</div>
                    <div className="font-mono text-base font-bold text-foreground">
                        {formatRupiah(monthBudget)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {dayOfMonth} hari × {formatRupiah(dailyAllowance)}
                    </div>
                </div>

                {/* Total spent */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-1 text-xs text-muted-foreground">Total Pengeluaran</div>
                    <div
                        className={`font-mono text-base font-bold ${monthTotal > monthBudget ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                            }`}
                    >
                        {formatRupiah(monthTotal)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {daysWithData} hari tercatat
                    </div>
                </div>
            </div>

            {/* Efficiency card */}
            <div
                className={`rounded-2xl border p-4 shadow-sm ${isEfficient
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isEfficient ? 'bg-emerald-100 dark:bg-emerald-900/60' : 'bg-rose-100 dark:bg-rose-900/60'
                            }`}
                    >
                        {isEfficient ? (
                            <PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <TrendingUp className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-sm text-foreground">
                            {isEfficient
                                ? `🎉 Kamu ${efficiencyPct}% lebih hemat bulan ini!`
                                : `😬 Kamu ${efficiencyPct}% over budget bulan ini`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {isEfficient
                                ? `Hemat ${formatRupiah(monthSaved)} dari total jatah`
                                : `Lebih ${formatRupiah(Math.abs(monthSaved))} dari total jatah`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Pengeluaran Harian</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                            Pengeluaran
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
                            Batas ({formatRupiahShort(dailyAllowance)})
                        </span>
                    </div>
                </div>

                {chartData.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                        Belum ada data bulan ini
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                            <defs>
                                <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                            <XAxis
                                dataKey="day"
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tickFormatter={formatRupiahShort}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatRupiah(value), 'Pengeluaran']}
                                labelFormatter={(label: number) => `Tanggal ${label}`}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid hsl(var(--border))',
                                    fontSize: '12px',
                                    background: 'hsl(var(--card))',
                                    color: 'hsl(var(--card-foreground))',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                }}
                            />
                            <ReferenceLine
                                y={dailyAllowance}
                                stroke="#f87171"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                            />
                            <Area
                                type="monotone"
                                dataKey="spent"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#spentGradient)"
                                dot={false}
                                activeDot={{ r: 4, fill: '#10b981' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Days breakdown */}
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-center">
                    <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{daysUnder}</div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Hari hemat</div>
                </div>
                <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-center">
                    <div className="font-mono text-lg font-bold text-rose-500 dark:text-rose-400">{daysOver}</div>
                    <div className="text-xs text-rose-600 dark:text-rose-300 font-medium">Hari boros</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 dark:bg-muted/20 p-3 text-center">
                    <div className="font-mono text-lg font-bold text-foreground">
                        {daysWithData > 0 ? formatRupiahShort(Math.round(monthTotal / daysWithData)) : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">Rata-rata/hari</div>
                </div>
            </div>
        </div>
    );
}
