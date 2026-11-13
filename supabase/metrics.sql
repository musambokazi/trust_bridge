-- Operator-only aggregate reporting. Do not expose these as an anonymous RPC.
select count(*) filter(where kind='company') as registered_businesses,count(*) as total_workspaces from public.workspaces;
select date_trunc('month',created_at) as month,count(distinct workspace_id) as active_workspaces,count(*) as assessments,count(*) filter(where result->>'level'='elevated') as elevated,count(*) filter(where result->>'level'='review') as review_required from public.assessments group by 1 order by 1 desc;
select status,count(*) from public.assessment_reviews group by status;
select plan,count(*) as operator_activated_entitlements from private.plan_entitlements where active_until is null or active_until>now() group by plan;
-- An activated entitlement is not proof of a paid invoice or received revenue.
