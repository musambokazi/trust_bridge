begin;
insert into auth.users(id,email,email_confirmed_at) values ('10000000-0000-4000-8000-000000000001','rls-owner@example.invalid',now()),('10000000-0000-4000-8000-000000000002','rls-other@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.profiles(id,first_name,last_name,username,phone,phone_country) values ('10000000-0000-4000-8000-000000000001','RLS','Owner','rls_owner_qa','+27820000000','ZA');
insert into public.workspaces(id,owner_id,kind,name,country,email,phone) values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','individual','RLS owner','South Africa','rls-owner@example.invalid','+27820000000');
insert into public.suppliers(id,workspace_id,name,bank_reference) values('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','RLS supplier','REF1234');
do $$ declare result jsonb; begin
 result := public.compare_invoice('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','INV-RLS','RLS supplier',100,'REF9999');
 if result->>'level' <> 'review' or result->>'submittedReference' <> '9999' then raise exception 'Comparison or masking failed'; end if;
 perform public.compare_invoice('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','INV-RLS','RLS supplier',100,'REF9999');
 if (select count(*) from public.assessments) <> 1 then raise exception 'Idempotency failed'; end if;
 begin
  insert into public.assessments(id,user_id,workspace_id,result) values(gen_random_uuid(),auth.uid(),'20000000-0000-4000-8000-000000000001','{}');
  raise exception 'Direct forged result insert succeeded';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.profiles) or exists(select 1 from public.workspaces) or exists(select 1 from public.suppliers) or exists(select 1 from public.assessments) then raise exception 'Cross-account read leaked'; end if;
 begin
  insert into public.profiles(id,first_name,last_name,username,phone,phone_country) values('10000000-0000-4000-8000-000000000001','Attack','Other','rls_other_qa','+27820000000','ZA');
  raise exception 'Ownership spoof succeeded';
 exception when insufficient_privilege then null; end;
 begin
  perform public.compare_invoice(gen_random_uuid(),'30000000-0000-4000-8000-000000000001','INV-OTHER','RLS supplier',100,'REF1234');
  raise exception 'Cross-account comparison succeeded';
 exception when raise_exception then
  if sqlerrm <> 'Supplier unavailable' then raise; end if;
 end;
end $$;
set local role anon;
do $$ begin
 begin perform count(*) from public.profiles; raise exception 'Anonymous profile read succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.compare_invoice(gen_random_uuid(),gen_random_uuid(),'INV','Supplier',1,'ABCD'); raise exception 'Anonymous RPC succeeded'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: own data, cross-account isolation, anonymous denial, server comparison, forged-result denial, masking and retry idempotency' as result;
rollback;
