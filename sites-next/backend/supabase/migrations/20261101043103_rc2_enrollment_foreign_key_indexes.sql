-- Development-only incremental FK coverage; preserves all rows and access rules.
create index enrollments_member_fk on mora_rc.enrollments(business_id,user_id);
create index enrollments_device_fk on mora_rc.enrollments(business_id,used_device);
