import { isDemoMode } from '@/lib/config';

import type { Backend } from './backend';
import { demoBackend } from './demo-backend';
import { supabaseBackend } from './supabase-backend';

/** Uses the live Supabase database when it's configured, otherwise the on-device demo. */
export const backend: Backend = isDemoMode ? demoBackend : supabaseBackend;

export type {
  AreaQuery,
  NewBusiness,
  NewClaim,
  NewNeighborRequest,
  NewNomination,
  NewWish,
  NominationForReview,
} from './backend';
