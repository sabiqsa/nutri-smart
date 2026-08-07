-- Phase 3: dashboard rekap needs a "Tidak Dibagikan" (explicitly not
-- distributed — e.g. patient discharged/NPO) stat category distinct from
-- "Belum Dibagikan" (pending, just hasn't happened yet). Our 3-value enum
-- didn't have that state.
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot run in the same transaction as a
-- statement that uses the new value — keep this migration file to just this
-- one statement, don't append anything else here.
alter type public.distribution_status add value 'not_distributed';
