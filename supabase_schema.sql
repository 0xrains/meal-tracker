-- ==============================================================================
-- MEAL TRACKER - MULTI-USER SUPABASE DATABASE SCHEMA
-- Jalankan seluruh script SQL ini di SQL Editor Supabase kamu.
-- Script ini mengatur pemisahan data per user menggunakan Supabase Auth (Email & Password).
-- ==============================================================================

-- 1. TABEL TRANSAKSI (transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    item TEXT NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    source TEXT DEFAULT 'Dompet',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp ON transactions (user_id, timestamp DESC);


-- 2. TABEL SUMBER DANA (funding_sources)
CREATE TABLE IF NOT EXISTS funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_funding_sources_user ON funding_sources (user_id);


-- 3. TABEL PENGATURAN APLIKASI (app_settings)
CREATE TABLE IF NOT EXISTS app_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, key)
);


-- ==============================================================================
-- 4. AUTOMATIC SEEDING TRIGGER UNTUK USER BARU
-- Setiap ada user baru yang register di Supabase Auth, otomatis dibuatkan:
--   - Sumber Dana bawaan (Dompet, ShopeePay, Seabank, Gopay, Dana, BRI)
--   - Target Anggaran Harian default (Rp30.000)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Masukkan sumber dana bawaan
    INSERT INTO public.funding_sources (user_id, name) VALUES
        (NEW.id, 'Dompet'),
        (NEW.id, 'ShopeePay'),
        (NEW.id, 'Seabank'),
        (NEW.id, 'Gopay'),
        (NEW.id, 'Dana'),
        (NEW.id, 'BRI')
    ON CONFLICT DO NOTHING;

    -- Masukkan pengaturan anggaran awal
    INSERT INTO public.app_settings (user_id, key, value)
    VALUES (NEW.id, 'daily_budget', '30000'::jsonb)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Memastikan SETIAP USER HANYA BISA MELIHAT & MENGUBAH DATA MILIKNYA SENDIRI
-- ==============================================================================

-- RLS untuk transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);


-- RLS untuk funding_sources
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own funding_sources" ON funding_sources;
CREATE POLICY "Users can view own funding_sources"
    ON funding_sources FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own funding_sources" ON funding_sources;
CREATE POLICY "Users can insert own funding_sources"
    ON funding_sources FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own funding_sources" ON funding_sources;
CREATE POLICY "Users can delete own funding_sources"
    ON funding_sources FOR DELETE
    USING (auth.uid() = user_id);


-- RLS untuk app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own app_settings" ON app_settings;
CREATE POLICY "Users can view own app_settings"
    ON app_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own app_settings" ON app_settings;
CREATE POLICY "Users can manage own app_settings"
    ON app_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
