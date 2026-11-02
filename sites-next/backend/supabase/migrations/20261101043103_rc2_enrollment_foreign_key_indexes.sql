-- Recovered verbatim from Mora development migration history on 2026-11-01.
-- Already applied as 20261101043103; do not replay on the existing project.
-- Development-only incremental FK coverage; preserves all rows and access rules.
create index enrollments_member_fk on mora_rc.enrollments(business_id,user_id);
create index enrollments_device_fk on mora_rc.enrollments(business_id,used_device);
