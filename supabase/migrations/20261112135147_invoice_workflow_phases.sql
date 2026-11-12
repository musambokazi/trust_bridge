begin;
alter table public.suppliers add column version integer not null default 1 check(version>0), add column last_change_reason text not null default 'Supplier added';
create table public.supplier_changes (
 id uuid primary key default gen_random_uuid(), supplier_id uuid not null references public.suppliers(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null, version integer not null,
 reason text not null check(char_length(reason) between 5 and 500), before_values jsonb, after_values jsonb not null,
 created_at timestamptz not null default now(), unique(supplier_id,version)
);
create index supplier_changes_workspace_date on public.supplier_changes(workspace_id,created_at desc);
create index supplier_changes_actor on public.supplier_changes(actor_id);
alter table public.supplier_changes enable row level security;
revoke all on public.supplier_changes from public,anon,authenticated;
grant select on public.supplier_changes to authenticated;
create policy supplier_changes_owner on public.supplier_changes for select to authenticated using(exists(select 1 from public.workspaces w where w.id=workspace_id and w.owner_id=(select auth.uid())));
create table public.assessment_reviews (
 assessment_id uuid primary key references public.assessments(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 contact_checked boolean not null, documents_checked boolean not null, discrepancies_resolved boolean not null,
 status text not null check(status in ('unresolved','reviewed')), notes text not null check(char_length(notes)<=2000),
 version integer not null check(version>0), updated_at timestamptz not null default now(),
 check(status <> 'reviewed' or (contact_checked and documents_checked and discrepancies_resolved))
);
create index assessment_reviews_user on public.assessment_reviews(user_id);
alter table public.assessment_reviews enable row level security;
revoke all on public.assessment_reviews from public,anon,authenticated;
grant select on public.assessment_reviews to authenticated;
create policy review_owner on public.assessment_reviews for select to authenticated using(user_id=(select auth.uid()));
create table private.workflow_receipts (
 user_id uuid not null references auth.users(id) on delete cascade, request_id uuid not null,
 payload_hash text not null, result jsonb not null, created_at timestamptz not null default now(), primary key(user_id,request_id)
);
alter table private.workflow_receipts enable row level security;
revoke all on private.workflow_receipts from public,anon,authenticated;

create function private.supplier_snapshot(s public.suppliers) returns jsonb language sql immutable security invoker set search_path='' as $$
 select jsonb_build_object('name',s.name,'category',s.category,'registration',s.registration,'contact',s.contact,'bankReference',right(s.bank_reference,4),'reviewedAt',s.reviewed_at,'version',s.version);
$$;
revoke all on function private.supplier_snapshot(public.suppliers) from public,anon,authenticated;
create function private.audit_supplier() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  new.version:=1; new.reviewed_at:=null; new.last_change_reason:='Supplier added';
 else
  if new.workspace_id <> old.workspace_id or new.id <> old.id then raise exception 'Supplier ownership cannot change'; end if;
  if char_length(trim(new.last_change_reason)) not between 5 and 500 then raise exception 'A change reason is required'; end if;
  new.version:=old.version+1;
 end if;
 if auth.uid() is not null and not exists(select 1 from public.workspaces w where w.id=new.workspace_id and w.owner_id=auth.uid()) then raise exception 'Supplier unavailable'; end if;
 insert into public.supplier_changes(supplier_id,workspace_id,actor_id,version,reason,before_values,after_values)
 values(new.id,new.workspace_id,auth.uid(),new.version,trim(new.last_change_reason),case when TG_OP='UPDATE' then private.supplier_snapshot(old) else null end,private.supplier_snapshot(new));
 return new;
end $$;
revoke all on function private.audit_supplier() from public,anon,authenticated;
-- The audit row's FK is deferred until the new supplier row exists.
alter table public.supplier_changes alter constraint supplier_changes_supplier_id_fkey deferrable initially deferred;
create trigger supplier_audit before insert or update on public.suppliers for each row execute function private.audit_supplier();
revoke update on public.suppliers from authenticated;

create function private.apply_workflow_operation(request_id uuid, operation text, entity_id uuid, expected_version integer, payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); fingerprint text; receipt private.workflow_receipts; s public.suppliers; a public.assessments; r public.assessment_reviews; response jsonb; current_version integer;
begin
 if uid is null or not exists(select 1 from auth.users u where u.id=uid and u.email_confirmed_at is not null) then raise exception 'Verified sign-in required'; end if;
 if request_id is null or entity_id is null or expected_version is null or expected_version<0 or operation is null or operation not in ('supplier','review') or payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>12000 then raise exception 'Invalid operation'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text||request_id::text,0));
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('operation',operation,'entity',entity_id,'version',expected_version,'payload',payload)::text,'UTF8')),'hex');
 select * into receipt from private.workflow_receipts x where x.user_id=uid and x.request_id=apply_workflow_operation.request_id;
 if found then
  if receipt.payload_hash<>fingerprint then raise exception 'Request identifier reused with different content'; end if;
  return receipt.result;
 end if;
 if operation='supplier' then
  select ss.* into s from public.suppliers ss join public.workspaces w on w.id=ss.workspace_id where ss.id=entity_id and w.owner_id=uid for update of ss;
  if not found then raise exception 'Supplier unavailable'; end if;
  if payload - array['name','category','registration','contact','bank_reference','reviewed','reason'] <> '{}'::jsonb
   or jsonb_typeof(payload->'name') is distinct from 'string' or jsonb_typeof(payload->'category') is distinct from 'string'
   or jsonb_typeof(payload->'registration') is distinct from 'string' or jsonb_typeof(payload->'contact') is distinct from 'string'
   or jsonb_typeof(payload->'reason') is distinct from 'string' or char_length(trim(payload->>'reason')) not between 5 and 500
   or jsonb_typeof(payload->'reviewed') is distinct from 'boolean'
   or (payload ? 'bank_reference' and jsonb_typeof(payload->'bank_reference') is distinct from 'string') then raise exception 'Invalid supplier change'; end if;
  if s.version<>expected_version then response:=jsonb_build_object('status','conflict','version',s.version);
  else
   update public.suppliers set name=trim(payload->>'name'),category=trim(payload->>'category'),registration=trim(payload->>'registration'),contact=trim(payload->>'contact'),
    bank_reference=case when payload ? 'bank_reference' then trim(payload->>'bank_reference') else s.bank_reference end,
    reviewed_at=case when (payload->>'reviewed')::boolean then now() else null end,last_change_reason=trim(payload->>'reason') where id=entity_id returning * into s;
   response:=jsonb_build_object('status','synced','version',s.version,'updatedAt',now());
  end if;
 else
  select aa.* into a from public.assessments aa join public.workspaces w on w.id=aa.workspace_id where aa.id=entity_id and aa.user_id=uid and w.owner_id=uid for update of aa;
  if not found then raise exception 'Assessment unavailable'; end if;
  if payload - array['contact_checked','documents_checked','discrepancies_resolved','status','notes'] <> '{}'::jsonb
    or jsonb_typeof(payload->'contact_checked') is distinct from 'boolean' or jsonb_typeof(payload->'documents_checked') is distinct from 'boolean'
    or jsonb_typeof(payload->'discrepancies_resolved') is distinct from 'boolean' or jsonb_typeof(payload->'notes') is distinct from 'string'
    or char_length(payload->>'notes')>2000 or payload->>'status' is null or payload->>'status' not in ('reviewed','unresolved') then raise exception 'Invalid review'; end if;
  if payload->>'status'='reviewed' and not ((payload->>'contact_checked')::boolean and (payload->>'documents_checked')::boolean and (payload->>'discrepancies_resolved')::boolean) then raise exception 'Complete every check before marking reviewed'; end if;
  select * into r from public.assessment_reviews where assessment_id=entity_id;
  current_version:=coalesce(r.version,0);
  if current_version<>expected_version then response:=jsonb_build_object('status','conflict','version',current_version);
  else
   insert into public.assessment_reviews(assessment_id,user_id,contact_checked,documents_checked,discrepancies_resolved,status,notes,version)
   values(entity_id,uid,(payload->>'contact_checked')::boolean,(payload->>'documents_checked')::boolean,(payload->>'discrepancies_resolved')::boolean,payload->>'status',payload->>'notes',current_version+1)
   on conflict(assessment_id) do update set contact_checked=excluded.contact_checked,documents_checked=excluded.documents_checked,discrepancies_resolved=excluded.discrepancies_resolved,status=excluded.status,notes=excluded.notes,version=excluded.version,updated_at=now();
   response:=jsonb_build_object('status','synced','version',current_version+1,'updatedAt',now());
  end if;
 end if;
 insert into private.workflow_receipts(user_id,request_id,payload_hash,result) values(uid,request_id,fingerprint,response);
 return response;
end $$;
revoke all on function private.apply_workflow_operation(uuid,text,uuid,integer,jsonb) from public,anon;
grant execute on function private.apply_workflow_operation(uuid,text,uuid,integer,jsonb) to authenticated;
create function public.apply_workflow_operation(request_id uuid, operation text, entity_id uuid, expected_version integer, payload jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select private.apply_workflow_operation(request_id,operation,entity_id,expected_version,payload); $$;
revoke all on function public.apply_workflow_operation(uuid,text,uuid,integer,jsonb) from public,anon;
grant execute on function public.apply_workflow_operation(uuid,text,uuid,integer,jsonb) to authenticated;

create or replace function private.compare_invoice(request_id uuid, supplier uuid, invoice_number text, invoice_name text, invoice_amount numeric, invoice_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.suppliers; w public.workspaces; existing jsonb; findings jsonb; payload jsonb; bank_diff boolean; name_diff boolean; uid uuid := auth.uid();
begin
 if uid is null or not exists(select 1 from auth.users u where u.id = uid and u.email_confirmed_at is not null) then raise exception 'Verified sign-in required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text||request_id::text,0));
 select a.result into existing from public.assessments a where a.id = request_id and a.user_id = uid;
 if existing is not null then return existing; end if;
 if request_id is null or supplier is null or invoice_number is null or char_length(trim(invoice_number)) not between 1 and 80 or invoice_name is null or char_length(trim(invoice_name)) not between 1 and 160 or invoice_reference is null or char_length(trim(invoice_reference)) not between 4 and 80 or invoice_amount is null or invoice_amount <= 0 or invoice_amount > 999999999 or invoice_amount <> round(invoice_amount,2) then raise exception 'Invalid invoice fields'; end if;
 select ss.* into s from public.suppliers ss join public.workspaces ww on ww.id = ss.workspace_id where ss.id = supplier and ww.owner_id = uid for share of ss;
 if not found then raise exception 'Supplier unavailable'; end if;
 bank_diff := lower(regexp_replace(trim(invoice_reference), '\s+', '', 'g')) <> lower(regexp_replace(trim(s.bank_reference), '\s+', '', 'g'));
 name_diff := lower(regexp_replace(trim(invoice_name), '\s+', '', 'g')) <> lower(regexp_replace(trim(s.name), '\s+', '', 'g'));
 findings := jsonb_build_array(
 jsonb_build_object('field','bank','title',case when bank_diff then 'Bank reference changed' else 'Bank reference matches' end,'detail','Compared with your saved supplier reference. This is not bank-account ownership verification.','mismatch',bank_diff),
 jsonb_build_object('field','name','title',case when name_diff then 'Supplier name differs' else 'Supplier name matches' end,'detail','Compared with the supplier name in your workspace.','mismatch',name_diff),
 jsonb_build_object('field','baseline','title',case when s.reviewed_at is null then 'Reference needs verification' else 'Reference marked reviewed by workspace owner' end,'detail','Confirm supplier instructions independently before payment. TrustBridge does not certify the supplier.','mismatch',s.reviewed_at is null));
 payload := jsonb_build_object('id',request_id,'supplierId',supplier,'invoiceNumber',trim(invoice_number),'supplierName',trim(invoice_name),'amount',invoice_amount,'date',now(),'level',case when bank_diff or name_diff or s.reviewed_at is null then 'review' else 'clear' end,'findings',findings,'approvedReference',right(s.bank_reference,4),'submittedReference',right(trim(invoice_reference),4));
 payload := payload || jsonb_build_object('comparison',jsonb_build_object(
  'supplierName',s.name,'invoiceName',trim(invoice_name),'supplierVersion',s.version,'supplierReviewedAt',s.reviewed_at,'capturedAt',now(),
  'rows',jsonb_build_array(
   jsonb_build_object('field','name','label','Supplier name','reference',s.name,'invoice',trim(invoice_name),'matches',not name_diff),
   jsonb_build_object('field','bank','label','Bank reference (last four)','reference','Masked: '||right(s.bank_reference,4),'invoice','Masked: '||right(trim(invoice_reference),4),'matches',not bank_diff)
  )));
 insert into public.assessments(id,user_id,workspace_id,supplier_id,result) values(request_id,uid,s.workspace_id,supplier,payload);
 return payload;
end $$;

commit;
