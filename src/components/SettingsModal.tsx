import { useState } from 'react';
import { X, Settings, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { OperationResult } from '../hooks/useTransactions';
import { formatRupiah } from '../lib/mealTracker';

interface SettingsModalProps {
    isOpen: boolean;
    currentBudget: number;
    onSave: (newBudget: number) => Promise<OperationResult>;
    onClose: () => void;
}

const PRESET_BUDGETS = [20000, 30000, 50000, 75000, 100000];

export function SettingsModal({
    isOpen,
    currentBudget,
    onSave,
    onClose,
}: SettingsModalProps) {
    const [budgetInput, setBudgetInput] = useState<string>(String(currentBudget));
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const val = parseInt(budgetInput.replace(/\D/g, ''), 10);
        if (isNaN(val) || val <= 0) {
            setErrorMsg('Nominal anggaran harus lebih dari Rp0');
            return;
        }

        setIsSaving(true);
        try {
            const res = await onSave(val);
            if (res.success) {
                onClose();
            } else {
                setErrorMsg(res.error || 'Gagal menyimpan anggaran.');
            }
        } catch (err: unknown) {
            console.error(err);
            setErrorMsg('Terjadi kesalahan saat menyimpan pengaturan.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-foreground/40 animate-modal-in backdrop-blur-sm"
                onClick={() => !isSaving && onClose()}
            />

            {/* Modal Dialog */}
            <div className="relative z-10 w-full max-w-md animate-fade-in rounded-2xl border border-border bg-card p-5 shadow-2xl">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                            <Settings className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Pengaturan Anggaran</h2>
                            <p className="text-xs text-muted-foreground">Sesuaikan jatah makan harianmu</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
                        aria-label="Tutup"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                        <div className="flex-1 font-medium">{errorMsg}</div>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                    {/* Budget input */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">
                            Target Anggaran Harian (Rp) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                Rp
                            </span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min="1000"
                                step="1000"
                                value={budgetInput}
                                onChange={e => setBudgetInput(e.target.value)}
                                disabled={isSaving}
                                placeholder="30000"
                                autoFocus
                                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-14 text-base font-mono font-semibold text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => setBudgetInput(prev => (prev ? prev + '000' : '10000'))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-muted px-2 py-1 font-mono text-xs font-semibold text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all disabled:opacity-50"
                            >
                                000
                            </button>
                        </div>
                    </div>

                    {/* Presets */}
                    <div>
                        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Pilihan Cepat:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_BUDGETS.map(preset => {
                                const isSelected = Number(budgetInput) === preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => setBudgetInput(String(preset))}
                                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold font-mono transition-all active:scale-95 ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                : 'border-border bg-background text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {formatRupiah(preset)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Explanatory note */}
                    <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                        💡 Anggaran ini digunakan sebagai patokan target harian, perhitungan sisa akumulasi hari sebelumnya, serta batas acuan pada grafik 7 hari dan rekap bulanan.
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    <span>Simpan Anggaran</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
