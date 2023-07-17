CREATE TABLE identity
(
    did text PRIMARY KEY,
    wallet_address text NOT NULL,
    mnemonic text NOT NULL,
    pubkey text NOT NULL,
    privkey text NOT NULL
)