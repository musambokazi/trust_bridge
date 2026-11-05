begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 first_name text not null check(char_length(first_name) between 1 and 100),
 last_name text not null check(char_length(last_name) between 1 and 100),
 username text not null unique check(username ~ '^[a-z0-9_]{3,30}$'),
 phone text not null check(phone ~ '^\+[1-9][0-9]{6,14}$'),
 phone_country text not null check(phone_country ~ '^[A-Z]{2}$'),
 text_scale numeric not null default 1 check(text_scale between 0.85 and 1.3),
 avatar_path text check(avatar_path is null or avatar_path = id::text || '/avatar.jpg'),
 created_at timestamptz not null default now()
);
create table public.workspaces (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references auth.users(id) on delete cascade,
 kind text not null check(kind in ('individual','company')),
 name text not null check(char_length(name) between 1 and 160),
 registration text not null default '' check(char_length(registration) <= 100),
 tax_number text not null default '' check(char_length(tax_number) <= 100),
 address text not null default '' check(char_length(address) <= 500),
 country text not null check(char_length(country) between 2 and 100),
 contact_name text not null default '' check(char_length(contact_name) <= 200),
 contact_role text not null default '' check(char_length(contact_role) <= 100),
 email text not null check(char_length(email) between 3 and 254),
 alternate_email text not null default '' check(char_length(alternate_email) <= 254),
 phone text not null check(phone ~ '^\+[1-9][0-9]{6,14}$'),
 alternate_phone text not null default '' check(alternate_phone = '' or alternate_phone ~ '^\+[1-9][0-9]{6,14}$'),
 industry text not null default '' check(char_length(industry) <= 250),
 offering text not null default '' check(char_length(offering) <= 500),
 created_at timestamptz not null default now(),
 check(kind <> 'company' or (registration <> '' and tax_number <> '' and address <> '' and contact_role <> '' and industry <> '' and offering <> ''))
);
create table public.suppliers (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 160),
 category text not null default '' check(char_length(category) <= 100),
 registration text not null default '' check(char_length(registration) <= 100),
 bank_reference text not null check(char_length(bank_reference) between 4 and 80),
 contact text not null default '' check(char_length(contact) <= 254),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create index suppliers_workspace_idx on public.suppliers(workspace_id);
create table public.assessments (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 supplier_id uuid references public.suppliers(id) on delete set null,
 result jsonb not null check(jsonb_typeof(result) = 'object'),
 created_at timestamptz not null default now()
);
create index assessments_user_date_idx on public.assessments(user_id, created_at desc);
create index assessments_workspace_idx on public.assessments(workspace_id);
create index assessments_supplier_idx on public.assessments(supplier_id);
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.suppliers enable row level security;
alter table public.assessments enable row level security;
revoke all on public.profiles, public.workspaces, public.suppliers, public.assessments from anon, authenticated;
grant select, insert, update on public.profiles, public.workspaces, public.suppliers to authenticated;
grant select on public.assessments to authenticated;
create policy profile_owner_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profile_owner_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profile_owner_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy workspace_owner_select on public.workspaces for select to authenticated using ((select auth.uid()) = owner_id);
create policy workspace_owner_insert on public.workspaces for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy workspace_owner_update on public.workspaces for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy supplier_owner_select on public.suppliers for select to authenticated using (exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid())));
create policy supplier_owner_insert on public.suppliers for insert to authenticated with check (exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid())));
create policy supplier_owner_update on public.suppliers for update to authenticated using (exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))) with check (exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid())));
create policy assessment_owner_select on public.assessments for select to authenticated using ((select auth.uid()) = user_id and exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid())));
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
-- A narrowly scoped function writes server-calculated results. Direct client inserts are forbidden.
create function public.compare_invoice(request_id uuid, supplier uuid, invoice_number text, invoice_name text, invoice_amount numeric, invoice_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.suppliers; w public.workspaces; existing jsonb; findings jsonb; payload jsonb; bank_diff boolean; name_diff boolean; uid uuid := auth.uid();
begin
 if uid is null or not exists(select 1 from auth.users u where u.id = uid and u.email_confirmed_at is not null) then raise exception 'Verified sign-in required'; end if;
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
 insert into public.assessments(id,user_id,workspace_id,supplier_id,result) values(request_id,uid,s.workspace_id,supplier,payload);
 return payload;
end $$;
revoke all on function public.compare_invoice(uuid,uuid,text,text,numeric,text) from public, anon;
grant execute on function public.compare_invoice(uuid,uuid,text,text,numeric,text) to authenticated;
-- Private avatar objects, limited to an account's fixed JPEG path.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',false,2097152,array['image/jpeg']);
create policy avatar_owner_select on storage.objects for select to authenticated using(bucket_id = 'avatars' and name = (select auth.uid())::text || '/avatar.jpg');
create policy avatar_owner_insert on storage.objects for insert to authenticated with check(bucket_id = 'avatars' and name = (select auth.uid())::text || '/avatar.jpg');
create policy avatar_owner_update on storage.objects for update to authenticated using(bucket_id = 'avatars' and name = (select auth.uid())::text || '/avatar.jpg') with check(bucket_id = 'avatars' and name = (select auth.uid())::text || '/avatar.jpg');
create policy avatar_owner_delete on storage.objects for delete to authenticated using(bucket_id = 'avatars' and name = (select auth.uid())::text || '/avatar.jpg');
commit;
