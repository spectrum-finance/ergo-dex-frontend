import {
  makeNativePools,
  makePools,
  NetworkPools,
} from '@ergolabs/ergo-dex-sdk';

import { explorer } from '../../../services/explorer';

export const networkPools = (): NetworkPools => makePools(explorer);
export const nativeNetworkPools = (): NetworkPools => makeNativePools(explorer);
