begin;
alter table public.suppliers add column tax_reference text not null default '' check(char_length(tax_reference)<=100), add column branch_code text not null default '' check(char_length(branch_code)<=20);
create table public.workspace_members(workspace_id uuid references public.workspaces on delete cascade, user_id uuid references auth.users on delete cascade, role text not null check(role in ('admin','reviewer','viewer')), created_at timestamptz not null default now(), primary key(workspace_id,user_id));
create index members_user on public.workspace_members(user_id);
create table private.workspace_invites(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces on delete cascade,email text not null,role text not null check(role in ('admin','reviewer','viewer')),token_hash text not null unique,expires_at timestamptz not null default now()+interval '48 hours',accepted_at timestamptz,created_at timestamptz not null default now());
create index invites_workspace on private.workspace_invites(workspace_id);
create table public.security_events(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces on delete cascade,actor_id uuid references auth.users on delete set null,action text not null,entity_id uuid,created_at timestamptz not null default now());
create index events_workspace_date on public.security_events(workspace_id,created_at desc);
create index events_actor on public.security_events(actor_id);
create table private.request_windows(user_id uuid references auth.users on delete cascade,bucket text,window_start timestamptz not null,hits integer not null,primary key(user_id,bucket));
create table private.plan_entitlements(workspace_id uuid primary key references public.workspaces on delete cascade,plan text not null check(plan in ('pilot','starter','business','professional')),active_until timestamptz,updated_at timestamptz not null default now());
create table public.plan_requests(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces on delete cascade,plan text not null check(plan in ('starter','business','professional')),status text not null default 'requested' check(status in ('requested','handled')),created_at timestamptz not null default now());
create index plan_requests_workspace on public.plan_requests(workspace_id);
create table private.report_key(id text primary key,secret_id uuid not null references vault.secrets(id),public_key text not null,created_at timestamptz not null default now(),revoked_at timestamptz);
create table public.signed_reports(id uuid primary key,workspace_id uuid not null references public.workspaces on delete cascade,assessment_id uuid not null references public.assessments on delete cascade,actor_id uuid references auth.users on delete set null,key_id text not null references private.report_key(id),pdf_hash text not null,manifest jsonb not null,signature text not null,created_at timestamptz not null default now());
create index reports_workspace on public.signed_reports(workspace_id);
create index reports_assessment on public.signed_reports(assessment_id);
create index reports_actor on public.signed_reports(actor_id);
create index reports_key on public.signed_reports(key_id);
alter table public.assessment_reviews add column workspace_id uuid references public.workspaces on delete cascade;
update public.assessment_reviews r set workspace_id=a.workspace_id from public.assessments a where a.id=r.assessment_id;
alter table public.assessment_reviews alter column workspace_id set not null;
create index reviews_workspace on public.assessment_reviews(workspace_id);

-- Helpers have fixed search paths, explicit grants, no caller-selectable identity.
create function private.workspace_role(wid uuid) returns text language sql stable security definer set search_path='' as $$
 select case when w.owner_id=auth.uid() then 'owner' else (select m.role from public.workspace_members m where m.workspace_id=w.id and m.user_id=auth.uid()) end from public.workspaces w where w.id=wid and (not exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified') or auth.jwt()->>'aal'='aal2');
$$;
revoke all on function private.workspace_role(uuid) from public,anon;
grant execute on function private.workspace_role(uuid) to authenticated;
create function public.workspace_role(wid uuid) returns text language sql security invoker set search_path='' as $$ select private.workspace_role(wid); $$;
revoke all on function public.workspace_role(uuid) from public,anon; grant execute on function public.workspace_role(uuid) to authenticated;
create function private.session_assured() returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) and (not exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified') or coalesce(auth.jwt()->>'aal','aal1')='aal2'); $$;
revoke all on function private.session_assured() from public,anon;grant execute on function private.session_assured() to authenticated;



alter policy profile_owner_select on public.profiles using(id=(select auth.uid()) and private.session_assured());
alter policy profile_owner_insert on public.profiles with check(id=(select auth.uid()) and private.session_assured());
alter policy profile_owner_update on public.profiles using(id=(select auth.uid()) and private.session_assured()) with check(id=(select auth.uid()) and private.session_assured());
create function private.require_user() returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then raise exception 'Verified sign-in required'; end if;
 if exists(select 1 from auth.mfa_factors where user_id=uid and status='verified') and coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'Complete two-factor authentication'; end if;
 return uid;
end $$;
revoke all on function private.require_user() from public,anon,authenticated;
create function private.throttle(bucket_name text,max_hits integer) returns void language plpgsql security definer set search_path='' as $$
declare hits integer;
begin
 insert into private.request_windows(user_id,bucket,window_start,hits) values(auth.uid(),bucket_name,date_trunc('minute',now()),1)
 on conflict(user_id,bucket) do update set window_start=excluded.window_start,hits=case when private.request_windows.window_start=excluded.window_start then private.request_windows.hits+1 else 1 end returning private.request_windows.hits into hits;
 if hits>max_hits then raise exception 'Rate limit reached. Retry in a minute'; end if;
end $$;
revoke all on function private.throttle(text,integer) from public,anon,authenticated;
create function private.record_event(wid uuid,event_name text,entity uuid default null) returns void language sql security definer set search_path='' as $$ insert into public.security_events(workspace_id,actor_id,action,entity_id) values(wid,auth.uid(),event_name,entity); $$;
revoke all on function private.record_event(uuid,text,uuid) from public,anon,authenticated;

alter table public.workspace_members enable row level security;
alter table public.security_events enable row level security;
alter table public.plan_requests enable row level security;
alter table public.signed_reports enable row level security;
revoke all on public.workspace_members,public.security_events,public.plan_requests,public.signed_reports from public,anon,authenticated;
grant select on public.workspace_members,public.security_events,public.plan_requests,public.signed_reports to authenticated;
create policy members_read on public.workspace_members for select to authenticated using(private.workspace_role(workspace_id) is not null);
create policy events_read on public.security_events for select to authenticated using(private.workspace_role(workspace_id) in ('owner','admin'));
create policy plans_read on public.plan_requests for select to authenticated using(private.workspace_role(workspace_id)='owner');
create policy reports_read on public.signed_reports for select to authenticated using(private.workspace_role(workspace_id) is not null);
alter table private.workspace_invites enable row level security;
alter table private.request_windows enable row level security;
alter table private.plan_entitlements enable row level security;
alter table private.report_key enable row level security;
revoke all on private.workspace_invites,private.request_windows,private.plan_entitlements,private.report_key from public,anon,authenticated;
create policy no_client_invites on private.workspace_invites for all to authenticated using(false) with check(false);
create policy no_client_windows on private.request_windows for all to authenticated using(false) with check(false);
create policy no_client_plans on private.plan_entitlements for all to authenticated using(false) with check(false);
create policy no_client_keys on private.report_key for all to authenticated using(false) with check(false);

alter policy workspace_owner_select on public.workspaces using(private.workspace_role(id) is not null);


alter policy supplier_owner_update on public.suppliers using(false) with check(false);
alter policy supplier_owner_select on public.suppliers using(private.workspace_role(workspace_id) is not null);
alter policy supplier_owner_insert on public.suppliers with check(private.workspace_role(workspace_id) in ('owner','admin'));

alter policy assessment_owner_select on public.assessments using(private.workspace_role(workspace_id) is not null);

alter policy supplier_changes_owner on public.supplier_changes using(private.workspace_role(workspace_id) is not null);

alter policy review_owner on public.assessment_reviews using(private.workspace_role(workspace_id) is not null);
-- Ownership cannot be transferred through a workspace profile update.
create function private.lock_workspace_owner() returns trigger language plpgsql set search_path='' as $$ begin if new.owner_id<>old.owner_id or new.id<>old.id then raise exception 'Workspace ownership cannot change'; end if; return new; end $$;
revoke all on function private.lock_workspace_owner() from public,anon,authenticated;
create trigger immutable_workspace_owner before update on public.workspaces for each row execute function private.lock_workspace_owner();

create function private.team_action(wid uuid,action text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=private.require_user(); code text; target uuid; invite private.workspace_invites; role_name text; email_address text;
begin
 perform private.throttle('team',20);
 if action='accept' then
  if char_length(coalesce(data->>'code',''))<>64 then raise exception 'Invalid invitation'; end if;
  select * into invite from private.workspace_invites where token_hash=encode(sha256(convert_to(data->>'code','UTF8')),'hex') for update;
  select lower(email) into email_address from auth.users where id=uid;
  if not found or invite.id is null or invite.accepted_at is not null or invite.expires_at<now() or invite.email<>email_address then raise exception 'Invalid or expired invitation for this account'; end if;
  if (select count(*) from public.workspace_members where workspace_id=invite.workspace_id)>=25 then raise exception 'Team limit reached'; end if;
  if private.workspace_role(invite.workspace_id)='owner' then raise exception 'Owner already has access'; end if;
  insert into public.workspace_members(workspace_id,user_id,role) values(invite.workspace_id,uid,invite.role) on conflict do nothing;
  update private.workspace_invites set accepted_at=now() where id=invite.id;
  perform private.record_event(invite.workspace_id,'team.invitation.accepted',uid);
  return jsonb_build_object('workspace_id',invite.workspace_id);
 end if;
 if private.workspace_role(wid)<>'owner' or private.workspace_role(wid) is null then raise exception 'Only the workspace owner can manage the team'; end if;
 if action='invite' then
  role_name:=data->>'role';email_address:=lower(trim(data->>'email'));
  if role_name is null or role_name not in ('admin','reviewer','viewer') or email_address is null or char_length(email_address)>254 or email_address !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Check invitation details'; end if;
  if (select count(*) from public.workspace_members where workspace_id=wid)>=25 then raise exception 'Team limit reached'; end if;
  code:=encode(extensions.gen_random_bytes(32),'hex');
  insert into private.workspace_invites(workspace_id,email,role,token_hash) values(wid,email_address,role_name,encode(sha256(convert_to(code,'UTF8')),'hex')) returning * into invite;
  perform private.record_event(wid,'team.invitation.created',invite.id);
  return jsonb_build_object('code',code,'expires_at',invite.expires_at,'id',invite.id);
 elsif action='remove' or action='role' then
  target:=(data->>'user_id')::uuid;role_name:=data->>'role';
  if action='remove' then delete from public.workspace_members where workspace_id=wid and user_id=target;
  else
   if role_name is null or role_name not in ('admin','reviewer','viewer') then raise exception 'Invalid role'; end if;
   update public.workspace_members set role=role_name where workspace_id=wid and user_id=target;
  end if;
  perform private.record_event(wid,'team.member.'||action,target);return jsonb_build_object('ok',true);
 elsif action='revoke' then
  delete from private.workspace_invites where id=(data->>'id')::uuid and workspace_id=wid and accepted_at is null;
  perform private.record_event(wid,'team.invitation.revoked',(data->>'id')::uuid);return jsonb_build_object('ok',true);
 end if;
 raise exception 'Unsupported team action';
end $$;
revoke all on function private.team_action(uuid,text,jsonb) from public,anon;grant execute on function private.team_action(uuid,text,jsonb) to authenticated;
create function public.team_action(wid uuid,action text,data jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.team_action(wid,action,data); $$;
revoke all on function public.team_action(uuid,text,jsonb) from public,anon;grant execute on function public.team_action(uuid,text,jsonb) to authenticated;
create function private.team_roster(wid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform private.require_user(); if private.workspace_role(wid) is null then raise exception 'Workspace unavailable'; end if;
 return jsonb_build_object('members',(select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'role',m.role,'name',p.first_name||' '||p.last_name,'username',p.username)),'[]'::jsonb) from public.workspace_members m left join public.profiles p on p.id=m.user_id where m.workspace_id=wid),'invitations',case when private.workspace_role(wid)='owner' then (select coalesce(jsonb_agg(jsonb_build_object('id',id,'email',email,'role',role,'expires_at',expires_at)),'[]'::jsonb) from private.workspace_invites where workspace_id=wid and accepted_at is null and expires_at>now()) else '[]'::jsonb end);
end $$;
revoke all on function private.team_roster(uuid) from public,anon;grant execute on function private.team_roster(uuid) to authenticated;
create function public.team_roster(wid uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.team_roster(wid); $$;
revoke all on function public.team_roster(uuid) from public,anon;grant execute on function public.team_roster(uuid) to authenticated;

-- Workspace metrics and server-enforced monthly allowances. Plans are activated only
-- by a verified billing integration/service operator, never by a client's own claim.
create function private.workspace_usage(wid uuid,requested_plan text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare plan_name text;quota integer;used bigint;
begin
 perform private.require_user(); if private.workspace_role(wid) is null then raise exception 'Workspace unavailable'; end if;
 select plan into plan_name from private.plan_entitlements where workspace_id=wid and (active_until is null or active_until>now());
 plan_name:=coalesce(plan_name,'pilot');quota:=case plan_name when 'starter' then 50 when 'business' then 300 else 1000 end;
 if requested_plan is not null then
  if private.workspace_role(wid)<>'owner' or requested_plan not in ('starter','business','professional') then raise exception 'Only the owner can request a listed plan'; end if;
  perform private.throttle('plan',5);
  if not exists(select 1 from public.plan_requests where workspace_id=wid and plan=requested_plan and status='requested') then insert into public.plan_requests(workspace_id,plan) values(wid,requested_plan); end if;
 end if;
 select count(*) into used from public.assessments where workspace_id=wid and created_at>=date_trunc('month',now());
 return jsonb_build_object('plan',plan_name,'limit',quota,'used',used,'remaining',greatest(0,quota-used),'resets_at',date_trunc('month',now())+interval '1 month','total_checks',(select count(*) from public.assessments where workspace_id=wid),'review_required',(select count(*) from public.assessments where workspace_id=wid and result->>'level'<>'clear'),'suppliers',(select count(*) from public.suppliers where workspace_id=wid),'billing_enabled',false);
end $$;
revoke all on function private.workspace_usage(uuid,text) from public,anon;grant execute on function private.workspace_usage(uuid,text) to authenticated;
create function public.workspace_usage(wid uuid,requested_plan text default null) returns jsonb language sql security invoker set search_path='' as $$ select private.workspace_usage(wid,requested_plan); $$;
revoke all on function public.workspace_usage(uuid,text) from public,anon;grant execute on function public.workspace_usage(uuid,text) to authenticated;

create table private.assessment_input_hash(assessment_id uuid primary key references public.assessments on delete cascade,input_hash text not null);
alter table private.assessment_input_hash enable row level security;
revoke all on private.assessment_input_hash from public,anon,authenticated;
create policy no_client_assessment_hash on private.assessment_input_hash for all to authenticated using(false) with check(false);

create function private.assess_invoice(request_id uuid,wid uuid,supplier uuid,invoice_number text,invoice_name text,invoice_amount numeric,invoice_reference text,invoice_tax text,invoice_branch text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=private.require_user();s public.suppliers;existing jsonb;flags jsonb:='[]';rows jsonb:='[]';outcome jsonb;missing boolean;diffs integer:=0;tier text;usage jsonb;field_name text;ref text;submitted text;agrees boolean; fingerprint text;stored_hash text;
begin
 if private.workspace_role(wid) is null or private.workspace_role(wid) not in ('owner','admin','reviewer') then raise exception 'Reviewer permission required'; end if;
 if request_id is null then raise exception 'Request identifier required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(wid::text||request_id::text,0));
 fingerprint:=encode(sha256(convert_to(jsonb_build_array(wid,supplier,invoice_number,invoice_name,invoice_amount,invoice_reference,invoice_tax,invoice_branch)::text,'UTF8')),'hex');
 select result into existing from public.assessments where id=request_id and workspace_id=wid;
 if existing is not null then
  select input_hash into stored_hash from private.assessment_input_hash where assessment_id=request_id;
  if stored_hash is null or stored_hash<>fingerprint then raise exception 'Request identifier reused with different content';end if;
  return existing;
 end if;
 if invoice_number is null or char_length(trim(invoice_number)) not between 1 and 80 or invoice_name is null or char_length(trim(invoice_name)) not between 1 and 160 or invoice_reference is null or char_length(trim(invoice_reference)) not between 4 and 80 or invoice_amount is null or invoice_amount<=0 or invoice_amount>999999999 or invoice_amount<>round(invoice_amount,2) or invoice_tax is null or char_length(invoice_tax)>100 or invoice_branch is null or char_length(invoice_branch)>20 then raise exception 'Invalid invoice fields'; end if;
 perform private.throttle('assessment',30);
 perform pg_advisory_xact_lock(hashtextextended('quota'||wid::text,0));
 usage:=private.workspace_usage(wid);
 if (usage->>'remaining')::integer<=0 then raise exception 'Monthly assessment allowance reached'; end if;
 if supplier is not null then select * into s from public.suppliers where id=supplier and workspace_id=wid for share; if not found then raise exception 'Supplier unavailable in this workspace'; end if; end if;
 missing:=trim(invoice_tax)='' or trim(invoice_branch)='';
 if s.id is null then
  tier:='elevated';flags:=jsonb_build_array(jsonb_build_object('field','supplier','title','No supplier baseline','detail','Hold payment until supplier identity and required tax/ID information have been checked through your onboarding process.','mismatch',true));
 else
  foreach field_name in array array['name','bank','tax','branch'] loop
   ref:=case field_name when 'name' then s.name when 'bank' then s.bank_reference when 'tax' then s.tax_reference else s.branch_code end;
   submitted:=case field_name when 'name' then trim(invoice_name) when 'bank' then trim(invoice_reference) when 'tax' then trim(invoice_tax) else trim(invoice_branch) end;
   agrees:=case when ref='' or submitted='' then null else lower(regexp_replace(ref,'\s+','','g'))=lower(regexp_replace(submitted,'\s+','','g')) end;
   if agrees is false then diffs:=diffs+1; end if;
   rows:=rows||jsonb_build_array(jsonb_build_object('field',field_name,'label',case field_name when 'name' then 'Supplier name' when 'bank' then 'Bank reference (last four)' when 'tax' then 'Tax reference (last four)' else 'Branch code' end,'reference',case when field_name in ('bank','tax') and ref<>'' then 'Masked: '||right(ref,4) else ref end,'invoice',case when field_name in ('bank','tax') and submitted<>'' then 'Masked: '||right(submitted,4) else submitted end,'matches',agrees));
   flags:=flags||jsonb_build_array(jsonb_build_object('field',field_name,'title',case when agrees is null then initcap(field_name)||' details unavailable' when agrees then initcap(field_name)||' details match' else initcap(field_name)||' details differ' end,'detail',case when agrees is null then 'The invoice or saved reference lacks this field. Confirm it independently before payment.' when agrees then 'Compared with the workspace reference; this does not establish authenticity.' else 'Pause and independently verify this change using an established supplier contact.' end,'mismatch',coalesce(not agrees,true)));
  end loop;
  tier:=case when diffs>=2 then 'elevated' when diffs>0 or missing or s.tax_reference='' or s.branch_code='' or s.reviewed_at is null then 'review' else 'low' end;
  if s.reviewed_at is null then flags:=flags||jsonb_build_array(jsonb_build_object('field','baseline','title','Reference needs verification','detail','A workspace owner or administrator must review the reference independently.','mismatch',true));end if;
 end if;
 outcome:=jsonb_build_object('id',request_id,'supplierId',coalesce(s.id::text,'unknown'),'invoiceNumber',trim(invoice_number),'supplierName',trim(invoice_name),'amount',invoice_amount,'date',now(),'level',case tier when 'low' then 'clear' when 'elevated' then 'elevated' else 'review' end,'riskTier',tier,'ruleVersion','2.0','recommendedAction',case tier when 'low' then 'Continue your standard payment approval process. A match does not authorise payment.' when 'review' then 'Pause and independently verify discrepancies through a trusted supplier contact.' else 'Hold payment and complete supplier onboarding or escalate the discrepancies to an authorised reviewer.' end,'findings',flags,'approvedReference',right(coalesce(s.bank_reference,''),4),'submittedReference',right(trim(invoice_reference),4),'taxReference',right(trim(invoice_tax),4),'branchCode',trim(invoice_branch));
 if s.id is not null then outcome:=outcome||jsonb_build_object('comparison',jsonb_build_object('supplierName',s.name,'invoiceName',trim(invoice_name),'supplierVersion',s.version,'supplierReviewedAt',s.reviewed_at,'capturedAt',now(),'rows',rows));end if;
 insert into public.assessments(id,user_id,workspace_id,supplier_id,result) values(request_id,uid,wid,s.id,outcome);
 insert into private.assessment_input_hash values(request_id,fingerprint);
 perform private.record_event(wid,'assessment.created',request_id);
 return outcome;
end $$;
revoke all on function private.assess_invoice(uuid,uuid,uuid,text,text,numeric,text,text,text) from public,anon;grant execute on function private.assess_invoice(uuid,uuid,uuid,text,text,numeric,text,text,text) to authenticated;
create function public.assess_invoice(request_id uuid,wid uuid,supplier uuid,invoice_number text,invoice_name text,invoice_amount numeric,invoice_reference text,invoice_tax text,invoice_branch text)
returns jsonb language sql security invoker set search_path='' as $$ select private.assess_invoice(request_id,wid,supplier,invoice_number,invoice_name,invoice_amount,invoice_reference,invoice_tax,invoice_branch); $$;
revoke all on function public.assess_invoice(uuid,uuid,uuid,text,text,numeric,text,text,text) from public,anon;grant execute on function public.assess_invoice(uuid,uuid,uuid,text,text,numeric,text,text,text) to authenticated;

create function private.report_context(assessment uuid,include_notes boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.assessments;review jsonb;uid uuid:=private.require_user();begin
 select * into a from public.assessments where id=assessment;
 if a.id is null or private.workspace_role(a.workspace_id) is null then raise exception 'Assessment unavailable';end if;
 perform private.throttle('report',10);
 select to_jsonb(r)-'workspace_id' into review from public.assessment_reviews r where r.assessment_id=a.id;
 if not coalesce(include_notes,false) then review:=review-'notes';end if;
 perform private.record_event(a.workspace_id,'report.requested',a.id);
 return jsonb_build_object('id',gen_random_uuid(),'issuedAt',now(),'workspaceId',a.workspace_id,'workspaceName',(select name from public.workspaces where id=a.workspace_id),'actorId',uid,'assessment',a.result,'review',review,'notesIncluded',coalesce(include_notes,false));
end $$;
revoke all on function private.report_context(uuid,boolean) from public,anon;grant execute on function private.report_context(uuid,boolean) to authenticated;
create function public.report_context(assessment uuid,include_notes boolean default false) returns jsonb language sql security invoker set search_path='' as $$ select private.report_context(assessment,include_notes); $$;
revoke all on function public.report_context(uuid,boolean) from public,anon;grant execute on function public.report_context(uuid,boolean) to authenticated;

-- Service-only key material RPC. The seed is generated in Edge memory and encrypted
-- in Vault. No private signing material is shipped to the application or repository.
create function private.report_key_material(seed text,public_key text) returns jsonb language plpgsql security definer set search_path='' as $$
declare k private.report_key;sid uuid;kid text;begin
 perform pg_advisory_xact_lock(hashtextextended('trustbridge-report-key',0));
 select * into k from private.report_key where revoked_at is null order by created_at desc limit 1;
 if k.id is null then
  if char_length(seed)<>44 or char_length(public_key)<>2604 then raise exception 'Invalid signing material';end if;
  kid:=encode(sha256(decode(public_key,'base64')),'hex');
  sid:=vault.create_secret(seed,'trustbridge-ml-dsa65-'||kid,'ML-DSA-65 signing seed. Server access only.');
  insert into private.report_key(id,secret_id,public_key) values(kid,sid,public_key) returning * into k;
 end if;
 return jsonb_build_object('id',k.id,'publicKey',k.public_key,'seed',(select decrypted_secret from vault.decrypted_secrets where id=k.secret_id));
end $$;
revoke all on function private.report_key_material(text,text) from public,anon,authenticated;grant execute on function private.report_key_material(text,text) to service_role;
create function public.report_key_material(seed text,public_key text) returns jsonb language sql security invoker set search_path='' as $$ select private.report_key_material(seed,public_key); $$;
revoke all on function public.report_key_material(text,text) from public,anon,authenticated;grant execute on function public.report_key_material(text,text) to service_role;
grant usage on schema private to service_role;
create function private.register_signed_report(manifest jsonb,signature text) returns void language plpgsql security definer set search_path='' as $$
declare a public.assessments;actor uuid:=(manifest->>'actorId')::uuid;wid uuid:=(manifest->>'workspaceId')::uuid;begin
 select * into a from public.assessments where id=(manifest->>'assessmentId')::uuid and workspace_id=wid;
 if a.id is null or not exists(select 1 from public.workspaces w where w.id=wid and (w.owner_id=actor or exists(select 1 from public.workspace_members m where m.workspace_id=wid and m.user_id=actor))) or manifest->>'pdfSha256' !~ '^[a-f0-9]{64}$' or char_length(signature)<>4412 then raise exception 'Invalid signed report';end if;
 insert into public.signed_reports(id,workspace_id,assessment_id,actor_id,key_id,pdf_hash,manifest,signature) values((manifest->>'id')::uuid,wid,a.id,actor,manifest->>'keyId',manifest->>'pdfSha256',manifest,signature);
 insert into public.security_events(workspace_id,actor_id,action,entity_id) values(wid,actor,'report.signed',(manifest->>'id')::uuid);
end $$;
revoke all on function private.register_signed_report(jsonb,text) from public,anon,authenticated;grant execute on function private.register_signed_report(jsonb,text) to service_role;
create function public.register_signed_report(manifest jsonb,signature text) returns void language sql security invoker set search_path='' as $$ select private.register_signed_report(manifest,signature); $$;
revoke all on function public.register_signed_report(jsonb,text) from public,anon,authenticated;grant execute on function public.register_signed_report(jsonb,text) to service_role;
create function private.report_public_keys() returns jsonb language sql stable security definer set search_path='' as $$ select coalesce(jsonb_agg(jsonb_build_object('id',id,'publicKey',public_key,'createdAt',created_at,'revokedAt',revoked_at)),'[]'::jsonb) from private.report_key; $$;
revoke all on function private.report_public_keys() from public,anon;grant execute on function private.report_public_keys() to authenticated;
create function public.report_public_keys() returns jsonb language sql security invoker set search_path='' as $$ select private.report_public_keys(); $$;
revoke all on function public.report_public_keys() from public,anon;grant execute on function public.report_public_keys() to authenticated;

create or replace function private.supplier_snapshot(s public.suppliers) returns jsonb language sql immutable security invoker set search_path='' as $$
 select jsonb_build_object('name',s.name,'category',s.category,'registration',s.registration,'contact',s.contact,'bankReference',right(s.bank_reference,4),'reviewedAt',s.reviewed_at,'version',s.version,'taxReference',right(s.tax_reference,4),'branchCode',s.branch_code);
$$;
revoke all on function private.supplier_snapshot(public.suppliers) from public,anon,authenticated;
create or replace function private.audit_supplier() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  new.version:=1; new.reviewed_at:=null; new.last_change_reason:='Supplier added';
 else
  if new.workspace_id <> old.workspace_id or new.id <> old.id then raise exception 'Supplier ownership cannot change'; end if;
  if char_length(trim(new.last_change_reason)) not between 5 and 500 then raise exception 'A change reason is required'; end if;
  new.version:=old.version+1;
 end if;
 if auth.uid() is not null then perform private.require_user(); perform private.throttle('supplier',20); end if;
 if auth.uid() is not null and coalesce(private.workspace_role(new.workspace_id),'') not in ('owner','admin') then raise exception 'Supplier unavailable'; end if;
 insert into public.supplier_changes(supplier_id,workspace_id,actor_id,version,reason,before_values,after_values)
 values(new.id,new.workspace_id,auth.uid(),new.version,trim(new.last_change_reason),case when TG_OP='UPDATE' then private.supplier_snapshot(old) else null end,private.supplier_snapshot(new));
 perform private.record_event(new.workspace_id,'supplier.'||lower(TG_OP),new.id);
 return new;
end $$;
revoke all on function private.audit_supplier() from public,anon,authenticated;

create or replace function private.apply_workflow_operation(request_id uuid, operation text, entity_id uuid, expected_version integer, payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=private.require_user(); fingerprint text; receipt private.workflow_receipts; s public.suppliers; a public.assessments; r public.assessment_reviews; response jsonb; current_version integer;
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
  select ss.* into s from public.suppliers ss join public.workspaces w on w.id=ss.workspace_id where ss.id=entity_id and private.workspace_role(w.id) in ('owner','admin') for update of ss;
  if not found then raise exception 'Supplier unavailable'; end if;
  if payload - array['name','category','registration','contact','bank_reference','reviewed','reason','tax_reference','branch_code'] <> '{}'::jsonb
   or jsonb_typeof(payload->'name') is distinct from 'string' or jsonb_typeof(payload->'category') is distinct from 'string'
   or jsonb_typeof(payload->'registration') is distinct from 'string' or jsonb_typeof(payload->'contact') is distinct from 'string'
   or jsonb_typeof(payload->'reason') is distinct from 'string' or char_length(trim(payload->>'reason')) not between 5 and 500
   or jsonb_typeof(payload->'reviewed') is distinct from 'boolean'
   or (payload ? 'bank_reference' and jsonb_typeof(payload->'bank_reference') is distinct from 'string') then raise exception 'Invalid supplier change'; end if;
  if payload ? 'tax_reference' and (jsonb_typeof(payload->'tax_reference') is distinct from 'string' or char_length(payload->>'tax_reference')>100) or payload ? 'branch_code' and (jsonb_typeof(payload->'branch_code') is distinct from 'string' or char_length(payload->>'branch_code')>20) then raise exception 'Invalid reference fields'; end if;
  if s.version<>expected_version then response:=jsonb_build_object('status','conflict','version',s.version);
  else
   update public.suppliers set name=trim(payload->>'name'),category=trim(payload->>'category'),registration=trim(payload->>'registration'),contact=trim(payload->>'contact'),
    tax_reference=coalesce(payload->>'tax_reference',s.tax_reference),branch_code=coalesce(payload->>'branch_code',s.branch_code),bank_reference=case when payload ? 'bank_reference' then trim(payload->>'bank_reference') else s.bank_reference end,
    reviewed_at=case when (payload->>'reviewed')::boolean then now() else null end,last_change_reason=trim(payload->>'reason') where id=entity_id returning * into s;
   response:=jsonb_build_object('status','synced','version',s.version,'updatedAt',now());
  end if;
 else
  select aa.* into a from public.assessments aa join public.workspaces w on w.id=aa.workspace_id where aa.id=entity_id and private.workspace_role(w.id) in ('owner','admin','reviewer') for update of aa;
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
   insert into public.assessment_reviews(assessment_id,user_id,workspace_id,contact_checked,documents_checked,discrepancies_resolved,status,notes,version)
   values(entity_id,uid,a.workspace_id,(payload->>'contact_checked')::boolean,(payload->>'documents_checked')::boolean,(payload->>'discrepancies_resolved')::boolean,payload->>'status',payload->>'notes',current_version+1)
   on conflict(assessment_id) do update set user_id=excluded.user_id,contact_checked=excluded.contact_checked,documents_checked=excluded.documents_checked,discrepancies_resolved=excluded.discrepancies_resolved,status=excluded.status,notes=excluded.notes,version=excluded.version,updated_at=now();
   response:=jsonb_build_object('status','synced','version',current_version+1,'updatedAt',now());
  end if;
 end if;
 perform private.throttle('workflow',30);
 if response->>'status'='synced' and operation='review' then perform private.record_event(a.workspace_id,'review.saved',entity_id); end if;
 insert into private.workflow_receipts(user_id,request_id,payload_hash,result) values(uid,request_id,fingerprint,response);
 return response;
end $$;
revoke all on function private.apply_workflow_operation(uuid,text,uuid,integer,jsonb) from public,anon;
grant execute on function private.apply_workflow_operation(uuid,text,uuid,integer,jsonb) to authenticated;
create or replace function public.apply_workflow_operation(request_id uuid, operation text, entity_id uuid, expected_version integer, payload jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select private.apply_workflow_operation(request_id,operation,entity_id,expected_version,payload); $$;
revoke all on function public.apply_workflow_operation(uuid,text,uuid,integer,jsonb) from public,anon;
grant execute on function public.apply_workflow_operation(uuid,text,uuid,integer,jsonb) to authenticated;


create or replace function private.compare_invoice(request_id uuid, supplier uuid, invoice_number text, invoice_name text, invoice_amount numeric, invoice_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.suppliers; w public.workspaces; existing jsonb; findings jsonb; payload jsonb; bank_diff boolean; name_diff boolean; uid uuid := private.require_user();
begin
 if uid is null or not exists(select 1 from auth.users u where u.id = uid and u.email_confirmed_at is not null) then raise exception 'Verified sign-in required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text||request_id::text,0));
 select a.result into existing from public.assessments a where a.id = request_id and private.workspace_role(a.workspace_id) is not null;
 if existing is not null then return existing; end if;
 if request_id is null or supplier is null or invoice_number is null or char_length(trim(invoice_number)) not between 1 and 80 or invoice_name is null or char_length(trim(invoice_name)) not between 1 and 160 or invoice_reference is null or char_length(trim(invoice_reference)) not between 4 and 80 or invoice_amount is null or invoice_amount <= 0 or invoice_amount > 999999999 or invoice_amount <> round(invoice_amount,2) then raise exception 'Invalid invoice fields'; end if;
 select ss.* into s from public.suppliers ss join public.workspaces ww on ww.id = ss.workspace_id where ss.id = supplier and private.workspace_role(ww.id) in ('owner','admin','reviewer') for share of ss;
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
 perform private.throttle('legacy-check',30);
 perform pg_advisory_xact_lock(hashtextextended('quota'||s.workspace_id::text,0));
 if (private.workspace_usage(s.workspace_id)->>'remaining')::integer<=0 then raise exception 'Monthly assessment allowance reached';end if;
 insert into public.assessments(id,user_id,workspace_id,supplier_id,result) values(request_id,uid,s.workspace_id,supplier,payload);
 perform private.record_event(s.workspace_id,'assessment.created',request_id);
 return payload;
end $$;


commit;
