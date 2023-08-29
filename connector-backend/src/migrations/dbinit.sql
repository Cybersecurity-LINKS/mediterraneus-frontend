CREATE TABLE identity
(
    eth_address text PRIMARY KEY,
    did text NOT NULL,
    privkey text NOT NULL,
    vc JSONB
);

CREATE TABLE local_asset_db
(
    nft_name text PRIMARY KEY,
    asset_path text NOT NULL,
    offering_path text NOT NULL,
    cid text NOT NULL,
    hash_asset text NOT NULL,
    hash_offering text NOT NULL,
    sign text NOT NULL
);