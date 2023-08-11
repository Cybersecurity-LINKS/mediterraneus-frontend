CREATE TABLE identity
(
    eth_address text PRIMARY KEY,
    did text NOT NULL,
    privkey text NOT NULL,
    vc JSONB
)