begin;
insert into auth.users(id,email,email_confirmed_at) values('10000000-0000-4000-8000-000000000021','owner-fulfil@example.invalid',now()),('10000000-0000-4000-8000-000000000022','member-fulfil@example.invalid',now()),('10000000-0000-4000-8000-000000000023','outsider-fulfil@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000021","role":"authenticated"}',true);
insert into public.workspaces(id,owner_id,kind,name,country,email,phone) values('20000000-0000-4000-8000-000000000021',auth.uid(),'individual','Fulfil test','South Africa','owner-fulfil@example.invalid','+27820000000');
insert into public.suppliers(id,workspace_id,name,bank_reference,tax_reference,branch_code) values('30000000-0000-4000-8000-000000000021','20000000-0000-4000-8000-000000000021','Supplier','BANK1234','TAX5678','250655');
create temp table test_invite(code text);grant all on test_invite to authenticated;
insert into test_invite select public.team_action('20000000-0000-4000-8000-000000000021','invite','{"email":"member-fulfil@example.invalid","role":"reviewer"}')->>'code';
do $$ declare r jsonb;begin
 r:=public.apply_workflow_operation(gen_random_uuid(),'supplier','30000000-0000-4000-8000-000000000021',1,'{"name":"Supplier","category":"","registration":"","contact":"","reviewed":true,"reason":"Confirmed all reference fields"}');
 r:=public.assess_invoice('40000000-0000-4000-8000-000000000021','20000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000021','INV-LOW','Supplier',100,'BANK1234','TAX5678','250655');
 if r->>'riskTier'<>'low' then raise exception 'Matching reviewed four-field reference not low: %',r;end if;
 r:=public.assess_invoice(gen_random_uuid(),'20000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000021','INV-REVIEW','Supplier',100,'CHANGED1234','TAX5678','250655');
 if r->>'riskTier'<>'review' or r#>>'{comparison,rows,1,matches}'<>'false' then raise exception 'Bank suffix match bypass';end if;
 r:=public.assess_invoice(gen_random_uuid(),'20000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000021','INV-HIGH','Supplier',100,'CHANGED1234','DIFFERENT5678','250655');
 if r->>'riskTier'<>'elevated' then raise exception 'Multiple discrepancies not elevated';end if;
 r:=public.assess_invoice(gen_random_uuid(),'20000000-0000-4000-8000-000000000021',null,'INV-UNKNOWN','Unknown',100,'BANK1234','','');
 if r->>'riskTier'<>'elevated' or r ? 'comparison' then raise exception 'Unknown supplier baseline invented';end if;
 begin perform public.report_key_material('a','b');raise exception 'Client accessed signing material';exception when insufficient_privilege then null;end;
 begin insert into public.security_events(workspace_id,action) values('20000000-0000-4000-8000-000000000021','forged');raise exception 'Client forged audit';exception when insufficient_privilege then null;end;
 begin update public.workspaces set owner_id='10000000-0000-4000-8000-000000000022';raise exception 'Ownership reassignment allowed';exception when raise_exception then if sqlerrm<>'Workspace ownership cannot change' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000023","role":"authenticated"}',true);
do $$ begin
 begin perform public.team_action(null,'accept',jsonb_build_object('code',(select code from test_invite)));raise exception 'Wrong email accepted invite';exception when raise_exception then if sqlerrm<>'Invalid or expired invitation for this account' then raise;end if;end;
 if exists(select 1 from public.suppliers) or exists(select 1 from public.assessments) then raise exception 'Outsider read leaked';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000022","role":"authenticated"}',true);
select public.team_action(null,'accept',jsonb_build_object('code',(select code from test_invite)));
do $$ declare r jsonb;begin
 if (select count(*) from public.suppliers)<>1 or public.workspace_role('20000000-0000-4000-8000-000000000021')<>'reviewer' then raise exception 'Member read failed';end if;
 r:=public.assess_invoice(gen_random_uuid(),'20000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000021','INV-MEMBER','Supplier',100,'BANK1234','TAX5678','250655');
 perform public.apply_workflow_operation(gen_random_uuid(),'review',(r->>'id')::uuid,0,'{"contact_checked":true,"documents_checked":true,"discrepancies_resolved":true,"status":"reviewed","notes":"Team review"}');
 begin perform public.apply_workflow_operation(gen_random_uuid(),'supplier','30000000-0000-4000-8000-000000000021',2,'{}');raise exception 'Reviewer edited supplier';exception when raise_exception then if sqlerrm<>'Supplier unavailable' then raise;end if;end;
 begin perform public.team_action('20000000-0000-4000-8000-000000000021','invite','{"email":"outsider@example.invalid","role":"admin"}');raise exception 'Reviewer invited admin';exception when raise_exception then if sqlerrm<>'Only the workspace owner can manage the team' then raise;end if;end;
 begin perform public.workspace_usage('20000000-0000-4000-8000-000000000021','professional');raise exception 'Member selected paid plan';exception when raise_exception then if sqlerrm<>'Only the owner can request a listed plan' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000021","role":"authenticated"}',true);
select public.team_action('20000000-0000-4000-8000-000000000021','role','{"user_id":"10000000-0000-4000-8000-000000000022","role":"viewer"}');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000022","role":"authenticated"}',true);
do $$ begin
 begin perform public.assess_invoice(gen_random_uuid(),'20000000-0000-4000-8000-000000000021',null,'INV-NO','Unknown',100,'REF1234','','');raise exception 'Viewer performed assessment';exception when raise_exception then if sqlerrm<>'Reviewer permission required' then raise;end if;end;
 if exists(select 1 from public.security_events) then raise exception 'Viewer read admin audit';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000021","role":"authenticated"}',true);
select public.team_action('20000000-0000-4000-8000-000000000021','remove','{"user_id":"10000000-0000-4000-8000-000000000022"}');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000022","role":"authenticated"}',true);
do $$ begin if exists(select 1 from public.suppliers) or exists(select 1 from public.assessments) or exists(select 1 from public.signed_reports) then raise exception 'Removed member retained server access';end if;end $$;
reset role;
-- A copied request ID cannot silently substitute another invoice.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000021","role":"authenticated"}',true);
do $$ begin
 begin perform public.assess_invoice('40000000-0000-4000-8000-000000000021','20000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000021','CHANGED','Supplier',100,'BANK1234','TAX5678','250655');raise exception 'Changed retry was accepted';exception when raise_exception then if sqlerrm<>'Request identifier reused with different content' then raise;end if;end;
 if public.account_data('20000000-0000-4000-8000-000000000021')::text like '%BANK1234%' or public.account_data('20000000-0000-4000-8000-000000000021')::text like '%TAX5678%' then raise exception 'Export leaked full references';end if;
end $$;
reset role;
insert into private.plan_entitlements(workspace_id,plan) values('20000000-0000-4000-8000-000000000021','starter');
insert into public.assessments(id,user_id,workspace_id,result) select gen_random_uuid(),'10000000-0000-4000-8000-000000000021','20000000-0000-4000-8000-000000000021','{"level":"review"}'::jsonb from generate_series(1,50);
set local role authenticated;
do $$ begin
 begin perform public.assess_invoice(gen_random_uuid(),'20000000-0000-4000-8000-000000000021',null,'OVER-LIMIT','Unknown',100,'BANK1234','','');raise exception 'Monthly quota bypass';exception when raise_exception then if sqlerrm<>'Monthly assessment allowance reached' then raise;end if;end;
 begin perform public.compare_invoice(gen_random_uuid(),'30000000-0000-4000-8000-000000000021','LEGACY-LIMIT','Supplier',100,'BANK1234');raise exception 'Legacy RPC bypassed monthly quota';exception when raise_exception then if sqlerrm<>'Monthly assessment allowance reached' then raise;end if;end;
end $$;
reset role;
insert into auth.mfa_factors(id,user_id,factor_type,status,secret,created_at,updated_at) values(gen_random_uuid(),'10000000-0000-4000-8000-000000000021','totp','verified','transactional-test-only',now(),now());
set local role authenticated;
do $$ begin
 if public.workspace_role('20000000-0000-4000-8000-000000000021') is not null then raise exception 'MFA step-up did not protect workspace';end if;
 begin perform public.team_roster('20000000-0000-4000-8000-000000000021');raise exception 'MFA bypass';exception when raise_exception then if sqlerrm<>'Complete two-factor authentication' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000021","role":"authenticated","aal":"aal2"}',true);
do $$ begin if public.workspace_role('20000000-0000-4000-8000-000000000021')<>'owner' then raise exception 'AAL2 owner denied';end if;end $$;
reset role;
select 'PASS: four-field risk tiers, unknown suppliers, role boundaries, invite email binding, ownership lock, signing-key isolation, member revocation, quota enforcement, input-bound retries, masked export and MFA step-up' as result;
rollback;
