-- Persist the actual receipt amount per appointment so "total billed" stats
-- stay accurate even if the practitioner's rate_per_session_eur changes later.
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS mydata_amount_eur DECIMAL(10,2);
