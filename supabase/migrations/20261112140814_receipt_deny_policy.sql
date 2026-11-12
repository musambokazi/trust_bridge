-- Server-only idempotency receipts. No authenticated grants are provided.
create policy workflow_receipts_no_client_access
 on private.workflow_receipts for all to authenticated
 using (false) with check (false);
