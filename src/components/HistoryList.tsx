import { useState } from 'react';
import { Pencil, Trash2, Clock, UtensilsCrossed, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction } from '../types';
import { DaySummary, formatRupiah } from '../lib/mealTracker';

interface HistoryListProps {
    transactions: Transaction[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => Promise<void> | void;
    summaries: Record<string, DaySummary>;
}

function formatDateHeader(dateStr: string): string {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hari Ini';
    if (isYesterday(date)) return 'Kemarin';
    return format(date, 'EEEE, d MMMM yyyy', { locale: id });
}

function formatTime(timestamp: string): string {
    try {
        return format(parseISO(timestamp), 'HH:mm');
    } catch {
        return '--:--';
    }
}

export function HistoryList({ transactions, onEdit, onDelete, summaries }: HistoryListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (txId: string) => {
        setDeletingId(txId);
        try {
            await onDelete(txId);
        } finally {
            setDeletingId(null);
        }
    };

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                    <UtensilsCrossed className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-foreground">Belum ada catatan</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                    Mulai catat pengeluaran makanmu hari ini dengan menekan tombol <strong>+</strong> di bawah.
                </p>
            </div>
        );
    }

    // Group transactions by date, sort desc
    const byDate: Record<string, Transaction[]> = {};
    for (const t of transactions) {
        const d = t.timestamp.split('T')[0];
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(t);
    }

    const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-4 animate-fade-in">
            {sortedDates.map(date => {
                const dayTxs = byDate[date].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                const summary = summaries[date];
                const isOver = summary && summary.spent > 30000;
                const isSaved = summary && summary.balance > 0;

                return (
                    <div key={date} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        {/* Date header */}
                        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                            <div>
                                <div className="text-sm font-semibold text-foreground">{formatDateHeader(date)}</div>
                                <div className="text-xs text-muted-foreground">{date}</div>
                            </div>
                            {summary && (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${isOver
                                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                            }`}
                                    >
                                        {formatRupiah(summary.spent)}
                                    </span>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSaved
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                            }`}
                                    >
                                        {isSaved ? '+' : ''}{formatRupiah(summary.balance)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Transactions */}
                        <div className="divide-y divide-border">
                            {dayTxs.map((tx, idx) => {
                                const isDeletingThis = deletingId === tx.id;
                                return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                    >
                                        {/* Index bubble */}
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                                            {idx + 1}
                                        </div>

                                        {/* Item info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium text-foreground">{tx.item}</div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                <Clock className="h-3 w-3 shrink-0" />
                                                <span>{formatTime(tx.timestamp)}</span>
                                                <span className="text-muted-foreground/40">•</span>
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                                    {tx.source || 'Dompet'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="font-mono text-sm font-semibold text-foreground">
                                            {formatRupiah(tx.amount)}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => onEdit(tx.id)}
                                                disabled={isDeletingThis}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 disabled:opacity-40"
                                                aria-label="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tx.id)}
                                                disabled={isDeletingThis}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-500 dark:hover:text-rose-400 active:scale-90 disabled:opacity-40"
                                                aria-label="Hapus"
                                            >
                                                {isDeletingThis ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day footer total */}
                        {dayTxs.length > 1 && (
                            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2">
                                <span className="text-xs text-muted-foreground">Total {dayTxs.length} item</span>
                                <span className="font-mono text-xs font-semibold text-foreground">
                                    {summary ? formatRupiah(summary.spent) : '—'}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
