# P-IPFS Verification Gateway

## Offering Messages Upload

The metadata describing the asset that a Data Owner (DO) wants to publish are referred to as Offerings. A DO may want to publish offerings that can be seen only by a restricted target of clients. To this extent the DO must include some Policies that describe the level of restriction associated to that offering. If no policies are provided, the offering is considered to be public, and hence, visible to any platform user. The platform catalogue will then filter the offerings to be shown based on the user’s identity. This requires an user willing to buy any asset from platform to request a VC. An Offering together with its Policies form an Offering Message.

![[]]

These data will be saved on a Private IPFS (P-IPFS) network. A Verification Gateway is put in front of the distributed storage to avoid non authorized peers from reading uploaded data. Anyone can upload data on the P-IPFS and must ask the Verification GW to perform the uploading. Furthermore, the only allowed entity that is enabled to read is the platform’s Catalogue. All the interactions must be performed over a protected channel (TLS).


## Installing a private-IPFS network

The installation of a private-IPFS network can be accomplished by following the following guide:

https://eleks.com/research/ipfs-network-data-replication/