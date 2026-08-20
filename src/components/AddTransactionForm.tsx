import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X, Check, ShoppingBag, AlertCircle, Loader2, Wallet, Plus, ChevronDown } from 'lucide-react';
import { Transaction } from '../types';
import { todayStr } from '../lib/mealTracker';
import { OperationResult } from '../hooks/useTransactions';
import { useFundingSources } from '../hooks/useFundingSources';

interface FormValues {
    item: string;
    amount: string;
    date: string;
    time: string;
    source: string;
}

interface AddTransactionFormProps {
    onSave: (data: Omit<Transaction, 'id'>) => Promise<OperationResult | void>;
    onCancel: () => void;
    initialValues?: Partial<Transaction>;
}

function getNowTime(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

export function AddTransactionForm({ onSave, onCancel, initialValues }: AddTransactionFormProps) {
    const isEditing = Boolean(initialValues?.id);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Funding sources from Supabase database
    const { sources, addFundingSource } = useFundingSources();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddingCustomSource, setIsAddingCustomSource] = useState(false);
    const [newCustomSourceInput, setNewCustomSourceInput] = useState('');
    const [isSavingSource, setIsSavingSource] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Parse initial timestamp into date + time
    let initDate = todayStr();
    let initTime = getNowTime();
    if (initialValues?.timestamp) {
        const [d, t] = initialValues.timestamp.split('T');
        initDate = d;
        initTime = t ? t.slice(0, 5) : getNowTime();
    }

    const {
        register,
        handleSubmit,
        setFocus,
        setValue,
        watch,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            item: initialValues?.item ?? '',
            amount: initialValues?.amount?.toString() ?? '',
            date: initDate,
            time: initTime,
            source: initialValues?.source ?? 'Dompet',
        },
    });

    const selectedSource = watch('source');

    useEffect(() => {
        setTimeout(() => setFocus('item'), 100);
    }, [setFocus]);

    const handleAddCustomSource = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newCustomSourceInput.trim();
        if (!trimmed) return;

        setIsSavingSource(true);
        try {
            // Save directly to Supabase 'funding_sources' table
            await addFundingSource(trimmed);
            setValue('source', trimmed, { shouldValidate: true });
            setNewCustomSourceInput('');
            setIsAddingCustomSource(false);
        } finally {
            setIsSavingSource(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        setServerError(null);
        const amountNum = parseInt(values.amount.replace(/\D/g, ''), 10);
        if (isNaN(amountNum) || amountNum <= 0) {
            setServerError('Nominal pengeluaran tidak valid.');
            return;
        }

        const chosenSource = values.source?.trim() || 'Dompet';

        // If it's not already in sources, also save to DB
        if (chosenSource && !sources.includes(chosenSource)) {
            addFundingSource(chosenSource);
        }

        const timestamp = `${values.date}T${values.time}:00`;

        setIsSaving(true);
        try {
            const res = await onSave({
                item: values.item.trim(),
                amount: amountNum,
                timestamp,
                source: chosenSource,
            });

            if (res && !res.success) {
                setServerError(res.error || 'Gagal menyimpan transaksi.');
            }
        } catch (err) {
            console.error(err);
            setServerError('Terjadi kesalahan tidak terduga saat menyimpan.');
        } finally {
            setIsSaving(false);
        }
    };

    const isPending = isSubmitting || isSaving;

    return (
        <div className="animate-fade-in rounded-2xl bg-card p-5 shadow-2xl max-h-[85vh] overflow-y-auto border border-border">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                        <ShoppingBag className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">
                        {isEditing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Server Error Alert Banner */}
            {serverError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                    <div className="flex-1 font-medium">{serverError}</div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Item name */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Nama Item <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ayam bakar"
                        disabled={isPending}
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${errors.item ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30' : 'border-border bg-background'
                            }`}
                        {...register('item', {
                            required: 'Nama item harus diisi',
                            minLength: { value: 1, message: 'Nama item tidak boleh kosong' },
                        })}
                    />
                    {errors.item && (
                        <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.item.message}</p>
                    )}
                </div>

                {/* Amount */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Nominal (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            Rp
                        </span>
                        <input
                            type="number"
                            inputMode="numeric"
                            placeholder="10000"
                            min="1"
                            disabled={isPending}
                            className={`w-full rounded-xl border py-2.5 pl-10 pr-14 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${errors.amount ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30' : 'border-border bg-background'
                                }`}
                            {...register('amount', {
                                required: 'Nominal harus diisi',
                                validate: val => {
                                    const num = Number(val);
                                    if (isNaN(num) || num <= 0) return 'Nominal harus lebih dari 0';
                                    return true;
                                },
                            })}
                        />
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                                const current = getValues('amount') || '';
                                setValue('amount', current + '000', { shouldValidate: true });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-muted px-2 py-1 font-mono text-xs font-semibold text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all disabled:opacity-50"
                        >
                            000
                        </button>
                    </div>
                    {errors.amount && (
                        <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.amount.message}</p>
                    )}
                </div>

                {/* Sumber Dana (Custom Styled Dropdown) */}
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Sumber Dana <span className="text-rose-500">*</span></span>
                        </label>
                        {!isAddingCustomSource && (
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setIsAddingCustomSource(true)}
                                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-50"
                            >
                                <Plus className="h-3 w-3" />
                                <span>Tambah Baru</span>
                            </button>
                        )}
                    </div>

                    {/* Custom Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                            className={`flex w-full items-center justify-between rounded-xl border bg-background px-3.5 py-2.5 text-sm font-medium transition-all outline-none disabled:opacity-50 ${isDropdownOpen
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'border-border hover:border-muted-foreground/30'
                                }`}
                        >
                            <div className="flex items-center gap-2.5 truncate">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                                    <Wallet className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate text-foreground">
                                    {selectedSource || 'Pilih sumber dana'}
                                </span>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                                    }`}
                            />
                        </button>

                        {/* Dropdown Menu Popup (Limit visible to ~4 items with scroll) */}
                        {isDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-[164px] overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-xl animate-fade-in divide-y divide-border/40">
                                <div className="space-y-0.5">
                                    {sources.map(src => {
                                        const isSelected = selectedSource === src;
                                        return (
                                            <button
                                                key={src}
                                                type="button"
                                                onClick={() => {
                                                    setValue('source', src, { shouldValidate: true });
                                                    setIsDropdownOpen(false);
                                                    setIsAddingCustomSource(false);
                                                }}
                                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${isSelected
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
                                                    : 'text-foreground hover:bg-muted'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`h-2 w-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-transparent'
                                                            }`}
                                                    />
                                                    <span>{src}</span>
                                                </div>
                                                {isSelected && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Custom Source Input Form */}
                    {isAddingCustomSource && (
                        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 animate-fade-in">
                            <input
                                type="text"
                                placeholder="Ketik nama sumber dana baru..."
                                value={newCustomSourceInput}
                                onChange={e => setNewCustomSourceInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomSource();
                                    }
                                }}
                                disabled={isPending || isSavingSource}
                                autoFocus
                                className="flex-1 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddCustomSource()}
                                disabled={isPending || isSavingSource || !newCustomSourceInput.trim()}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                            >
                                {isSavingSource ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                <span>Simpan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddingCustomSource(false);
                                    setNewCustomSourceInput('');
                                }}
                                disabled={isPending || isSavingSource}
                                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                            >
                                Batal
                            </button>
                        </div>
                    )}
                </div>

                {/* Date and Time row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Tanggal <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            disabled={isPending}
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                            {...register('date', { required: 'Tanggal wajib diisi' })}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Jam <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="time"
                            disabled={isPending}
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                            {...register('time', { required: 'Jam wajib diisi' })}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isPending}
                        className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                <span>{isEditing ? 'Simpan' : 'Tambah'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}


