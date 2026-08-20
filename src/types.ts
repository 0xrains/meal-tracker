export interface Transaction {
    id: string;
    user_id?: string;
    timestamp: string; // ISO string - full datetime
    item: string;
    amount: number; // in Rupiah, always positive
    source?: string; // Sumber dana: Dompet, ShopeePay, Seabank, Gopay, Dana, BRI, atau kustom
}

export interface DayData {
    date: string; // YYYY-MM-DD
    transactions: Transaction[];
    totalSpent: number;
    balance: number; // carryover balance at end of day
    allowance: number; // daily base (30000) + rollover from previous
}
