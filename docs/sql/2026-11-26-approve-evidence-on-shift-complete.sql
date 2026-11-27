-- When a shift is marked complete (WF-6 inserts the pay record, or a supervisor logs pay by hand), that cleaner's
-- still-pending evidence for that job is approved, so Pending Approvals stops piling up.
-- Only 'pending' changes: 'reclean_requested' and 'needs_attention' are left alone.
-- No feedback_comments rows are written, so WF-11 (feedback notification) is not triggered.

begin;

create or replace function public.approve_pending_logs_on_pay_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cleaning_logs
     set status = 'approved'
   where job_id = new.job_id
     and cleaner_id = new.cleaner_id
     and status = 'pending';
  return new;
end $$;

revoke all on function public.approve_pending_logs_on_pay_record() from public, anon, authenticated;

drop trigger if exists approve_pending_logs_on_pay_record on public.pay_records;
create trigger approve_pending_logs_on_pay_record
  after insert on public.pay_records
  for each row execute function public.approve_pending_logs_on_pay_record();

commit;

-- ONE-OFF BACKLOG (optional, run only with Kevin's OK): approve pending evidence for shifts that already have pay.
--   update public.cleaning_logs cl set status = 'approved'
--    where cl.status = 'pending'
--      and exists (select 1 from public.pay_records pr where pr.job_id = cl.job_id and pr.cleaner_id = cl.cleaner_id)
--   returning cl.id;   -- keep the returned ids: they are the only way to undo exactly

-- ROLLBACK:
--   drop trigger if exists approve_pending_logs_on_pay_record on public.pay_records;
--   drop function if exists public.approve_pending_logs_on_pay_record();
