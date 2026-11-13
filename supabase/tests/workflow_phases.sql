begin;
insert into auth.users(id,email,email_confirmed_at) values('10000000-0000-4000-8000-000000000011','phase-owner@example.invalid',now()),('10000000-0000-4000-8000-000000000012','phase-other@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000011","role":"authenticated"}',true);
insert into public.workspaces(id,owner_id,kind,name,country,email,phone) values('20000000-0000-4000-8000-000000000011',auth.uid(),'individual','Phase test','South Africa','phase-owner@example.invalid','+27820000000');
insert into public.suppliers(id,workspace_id,name,bank_reference,contact,version,reviewed_at) values('30000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000011','Original Supplier','REF1234','trusted@example.invalid',999,now());
do $$ declare result jsonb; payload jsonb := '{"name":"New Supplier","category":"Office","registration":"REG","contact":"trusted@example.invalid","bank_reference":"REF5678","reviewed":true,"reason":"Confirmed with established contact"}'; review jsonb:='{"contact_checked":true,"documents_checked":true,"discrepancies_resolved":true,"status":"reviewed","notes":"Checked supporting documents"}'; begin
 if (select version<>1 or reviewed_at is not null from public.suppliers limit 1) then raise exception 'Client forged insert version/review timestamp'; end if;
 result:=public.compare_invoice('40000000-0000-4000-8000-000000000011','30000000-0000-4000-8000-000000000011','INV-PHASE','Original Supplier',100,'DIFFERENT1234');
 if result#>>'{comparison,rows,1,matches}' <> 'false' then raise exception 'Masked suffix collision caused a false match'; end if;
 if result::text like '%DIFFERENT1234%' or result::text like '%REF1234%' then raise exception 'Unmasked bank reference leaked'; end if;
 result:=public.apply_workflow_operation('50000000-0000-4000-8000-000000000011','supplier','30000000-0000-4000-8000-000000000011',1,payload);
 if result->>'status'<>'synced' or result->>'version'<>'2' then raise exception 'Supplier change failed'; end if;
 perform public.apply_workflow_operation('50000000-0000-4000-8000-000000000011','supplier','30000000-0000-4000-8000-000000000011',1,payload);
 if (select count(*) from public.supplier_changes)<>2 then raise exception 'Retry duplicated audit rows'; end if;
 if exists(select 1 from public.supplier_changes where before_values::text like '%REF1234%' or after_values::text like '%REF5678%') then raise exception 'Audit leaked full references'; end if;
 if (select aa.result#>>'{comparison,supplierName}' from public.assessments aa limit 1)<>'Original Supplier' then raise exception 'Comparison snapshot mutated with supplier'; end if;
 begin
  perform public.apply_workflow_operation('50000000-0000-4000-8000-000000000011','supplier','30000000-0000-4000-8000-000000000011',1,payload||'{"name":"Another"}');
  raise exception 'Request ID reuse was accepted';
 exception when raise_exception then if sqlerrm<>'Request identifier reused with different content' then raise; end if; end;
 result:=public.apply_workflow_operation('50000000-0000-4000-8000-000000000012','supplier','30000000-0000-4000-8000-000000000011',1,payload);
 if result->>'status'<>'conflict' or (select version from public.suppliers limit 1)<>2 then raise exception 'Stale supplier overwrite'; end if;
 begin
  perform public.apply_workflow_operation('60000000-0000-4000-8000-000000000011','review','40000000-0000-4000-8000-000000000011',0,review||'{"contact_checked":false}');
  raise exception 'Incomplete checklist marked reviewed';
 exception when raise_exception then if sqlerrm<>'Complete every check before marking reviewed' then raise; end if; end;
 result:=public.apply_workflow_operation('60000000-0000-4000-8000-000000000011','review','40000000-0000-4000-8000-000000000011',0,review);
 perform public.apply_workflow_operation('60000000-0000-4000-8000-000000000011','review','40000000-0000-4000-8000-000000000011',0,review);
 if result->>'status'<>'synced' or (select version from public.assessment_reviews limit 1)<>1 then raise exception 'Review retry idempotency failed'; end if;
 result:=public.apply_workflow_operation('60000000-0000-4000-8000-000000000012','review','40000000-0000-4000-8000-000000000011',0,review);
 if result->>'status'<>'conflict' then raise exception 'Stale review overwrite'; end if;
 begin update public.suppliers set name='Forged'; raise exception 'Direct update allowed'; exception when insufficient_privilege then null; end;
 begin delete from public.supplier_changes; raise exception 'Audit deletion allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.assessment_reviews(assessment_id,user_id,contact_checked,documents_checked,discrepancies_resolved,status,notes,version,updated_at) values('40000000-0000-4000-8000-000000000011',auth.uid(),true,true,true,'reviewed','Forged',99,now()); raise exception 'Direct review write allowed'; exception when insufficient_privilege then null; end;
 begin perform count(*) from private.workflow_receipts; raise exception 'Private receipt read allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000012","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.supplier_changes) or exists(select 1 from public.assessment_reviews) then raise exception 'Cross-account read leaked'; end if;
 begin perform public.apply_workflow_operation(gen_random_uuid(),'supplier','30000000-0000-4000-8000-000000000011',2,'{}'); raise exception 'Cross-account write succeeded'; exception when raise_exception then if sqlerrm<>'Supplier unavailable' then raise; end if; end;
 begin perform public.apply_workflow_operation(gen_random_uuid(),'review','40000000-0000-4000-8000-000000000011',1,'{}'); raise exception 'Cross-account review succeeded'; exception when raise_exception then if sqlerrm<>'Assessment unavailable' then raise; end if; end;
end $$;
set local role anon;
do $$ begin
 begin perform public.apply_workflow_operation(gen_random_uuid(),'supplier',gen_random_uuid(),0,'{}'); raise exception 'Anonymous operation succeeded'; exception when insufficient_privilege then null; end;
 begin perform count(*) from public.supplier_changes; raise exception 'Anonymous audit read succeeded'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: snapshot immutability, masked suffix mismatch, audit integrity, server versioning, idempotency, conflicts, checklist validation, cross-account isolation and anonymous denial' as result;
rollback;
