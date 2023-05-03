import { IndexerPluginClient, SingleNodeClient } from '@iota/iota.js';
import { writable } from 'svelte/store';
import { NETWORKS } from '../constants'

export const indexerClient = writable<IndexerPluginClient>();
export const nodeClient = writable<SingleNodeClient>();

export const client = new SingleNodeClient(NETWORKS[0].apiEndpoint);
nodeClient?.set(client);
indexerClient?.set(new IndexerPluginClient(client));
