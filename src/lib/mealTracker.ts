import { Transaction } from '../types';

export const DAILY_ALLOWANCE = 30000;

export function formatRupiah(amount: number): string {
    const abs = Math.abs(amount);
    return (amount < 0 ? '-' : '') + 'Rp' + abs.toLocaleString('id-ID');
}

// Helper to format date as YYYY-MM-DD in local time
export function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Get today's date string YYYY-MM-DD in local time
export function todayStr(): string {
    return toLocalDateString(new Date());
}

// Get date range: from startDate to endDate inclusive
export function getDatesInRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const cur = new Date(start + 'T00:00:00');
    const endD = new Date(end + 'T00:00:00');
    while (cur <= endD) {
        dates.push(toLocalDateString(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

export type DaySummary = {
    spent: number;
    allowance: number;
    balance: number; // money left at END of day (can be negative)
    transactions: Transaction[];
};

// Build daily summaries from all transactions.
// Rollover: each day starts with dailyAllowance + previous day's leftover.
// leftover = allowance - spent (can be negative if overspent)
export function buildDailySummaries(
    transactions: Transaction[],
    dailyAllowance: number = DAILY_ALLOWANCE
): Record<string, DaySummary> {
    if (transactions.length === 0) return {};

    // Group by date
    const byDate: Record<string, Transaction[]> = {};
    for (const t of transactions) {
        const d = t.timestamp.split('T')[0];
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(t);
    }

    // Get all dates from first transaction to today, sorted
    const allDates = Object.keys(byDate).sort();
    const firstDate = allDates[0];
    const today = todayStr();
    const allDatesRange = getDatesInRange(firstDate, today);

    const result: Record<string, DaySummary> = {};
    let carryover = 0;

    for (const date of allDatesRange) {
        const dayTransactions = byDate[date] || [];
        const spent = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        const allowance = dailyAllowance + carryover;
        const balance = allowance - spent; // positive = saved, negative = overspent

        result[date] = { spent, allowance, balance, transactions: dayTransactions };
        carryover = balance; // carry leftover (or debt) to next day
    }

    return result;
}

// Get today's available balance for display
export function getTodayBalance(
    transactions: Transaction[],
    dailyAllowance: number = DAILY_ALLOWANCE
): {
    availableBalance: number;
    spentToday: number;
    todayAllowance: number;
    yesterdayBalance: number;
} {
    const summaries = buildDailySummaries(transactions, dailyAllowance);
    const today = todayStr();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toLocalDateString(yesterdayDate);

    const todaySummary = summaries[today] || {
        spent: 0,
        allowance: dailyAllowance,
        balance: dailyAllowance,
        transactions: [],
    };
    const yesterdaySummary = summaries[yesterday];
    const yesterdayBalance = yesterdaySummary ? yesterdaySummary.balance : 0;

    return {
        availableBalance: todaySummary.balance,
        spentToday: todaySummary.spent,
        todayAllowance: todaySummary.allowance,
        yesterdayBalance,
    };
}
