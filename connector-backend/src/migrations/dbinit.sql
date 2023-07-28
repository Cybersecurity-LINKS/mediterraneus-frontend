CREATE TABLE identity
(
    did text PRIMARY KEY,
    privkey text NOT NULL,
    vc JSONB
)