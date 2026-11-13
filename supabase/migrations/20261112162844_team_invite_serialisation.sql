begin;
create or replace function private.team_action(wid uuid,action text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=private.require_user(); code text; target uuid; invite private.workspace_invites; role_name text; email_address text;
begin
 perform private.throttle('team',20);
 if action='accept' then
  if char_length(coalesce(data->>'code',''))<>64 then raise exception 'Invalid invitation'; end if;
  select * into invite from private.workspace_invites where token_hash=encode(sha256(convert_to(data->>'code','UTF8')),'hex') for update;
  select lower(email) into email_address from auth.users where id=uid;
  if not found or invite.id is null or invite.accepted_at is not null or invite.expires_at<now() or invite.email<>email_address then raise exception 'Invalid or expired invitation for this account'; end if;
  perform pg_advisory_xact_lock(hashtextextended('team'||invite.workspace_id::text,0));
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

create unique index one_open_plan_request on public.plan_requests(workspace_id,plan) where status='requested';
commit;
