/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export { getMimeTypeFromExtension, EnrichmentHandler } from './enrichmentHandler.js';
export { ENDPOINT_ENRICHMENT, MIME_TYPES } from './constants.js';
export { EnrichmentMetrics } from './enrichmentMetrics.js';
export type {
  ContentBundleFile,
  ContentBundle,
  EnrichmentRequestBody,
  EnrichmentMetadata,
  EnrichmentResult,
  EnrichMetadataResult,
  EnrichmentRequestRecord,
} from './enrichmentHandler.js';
