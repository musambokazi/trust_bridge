alter function public.compare_invoice(uuid,uuid,text,text,numeric,text) set schema private;
grant usage on schema private to authenticated;
revoke all on function private.compare_invoice(uuid,uuid,text,text,numeric,text) from public, anon;
grant execute on function private.compare_invoice(uuid,uuid,text,text,numeric,text) to authenticated;
create function public.compare_invoice(request_id uuid, supplier uuid, invoice_number text, invoice_name text, invoice_amount numeric, invoice_reference text)
returns jsonb language sql security invoker set search_path = '' as $$
 select private.compare_invoice(request_id,supplier,invoice_number,invoice_name,invoice_amount,invoice_reference);
$$;
revoke all on function public.compare_invoice(uuid,uuid,text,text,numeric,text) from public, anon;
grant execute on function public.compare_invoice(uuid,uuid,text,text,numeric,text) to authenticated;
