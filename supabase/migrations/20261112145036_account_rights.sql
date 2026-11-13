begin;
create function private.account_data(wid uuid,delete_check boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=private.require_user();begin
 if delete_check then
  if exists(select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id where w.owner_id=uid) then raise exception 'Remove workspace members before deleting an owner account';end if;
  if exists(select 1 from public.assessments a join public.workspaces w on w.id=a.workspace_id where a.user_id=uid and w.owner_id<>uid) or exists(select 1 from public.assessment_reviews r join public.workspaces w on w.id=r.workspace_id where r.user_id=uid and w.owner_id<>uid) then raise exception 'Shared company records require an operator retention review before account deletion';end if;
  perform private.throttle('delete-check',5);return jsonb_build_object('user_id',uid,'allowed',true);
 end if;
 if private.workspace_role(wid) is null then raise exception 'Workspace unavailable';end if;
 perform private.throttle('data-export',5);
 perform private.record_event(wid,'data.export.requested');
 return jsonb_build_object('generated_at',now(),'workspace_id',wid,'profile',(select to_jsonb(p) from public.profiles p where p.id=uid),'workspace',(select to_jsonb(w) from public.workspaces w where w.id=wid),
 'suppliers',(select coalesce(jsonb_agg(private.supplier_snapshot(s)),'[]'::jsonb) from (select * from public.suppliers where workspace_id=wid order by id limit 1000) s),
 'assessments',(select coalesce(jsonb_agg(result),'[]'::jsonb) from (select result from public.assessments where workspace_id=wid order by created_at desc limit 1000) a),
 'reviews',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from (select * from public.assessment_reviews where workspace_id=wid order by updated_at desc limit 1000) r),
 'limits',jsonb_build_object('maximum_per_collection',1000,'suppliers_truncated',(select count(*)>1000 from public.suppliers where workspace_id=wid),'assessments_truncated',(select count(*)>1000 from public.assessments where workspace_id=wid),'reviews_truncated',(select count(*)>1000 from public.assessment_reviews where workspace_id=wid)),
 'notice','This is an authorised current-workspace export, not an export of every historical company record. Banking and tax reference fields are masked. Contact the operator for a complete subject-access request when any collection is truncated.');
end $$;
revoke all on function private.account_data(uuid,boolean) from public,anon;grant execute on function private.account_data(uuid,boolean) to authenticated;
create function public.account_data(wid uuid,delete_check boolean default false) returns jsonb language sql security invoker set search_path='' as $$ select private.account_data(wid,delete_check); $$;
revoke all on function public.account_data(uuid,boolean) from public,anon;grant execute on function public.account_data(uuid,boolean) to authenticated;
commit;
