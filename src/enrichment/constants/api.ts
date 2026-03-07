/*
 * Copyright 2026, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { MetadataType } from '@salesforce/source-deploy-retrieve';
import type { EnrichmentRequestBody, EnrichMetadataResponse } from '../types/index.js';
import {
  SOURCE_COMPONENT_TYPE_NAME_CUSTOM_OBJECT,
  SOURCE_COMPONENT_TYPE_NAME_FLEXIPAGE,
  SOURCE_COMPONENT_TYPE_NAME_LIGHTNING_TYPE,
  SOURCE_COMPONENT_TYPE_NAME_LWC,
} from './component.js';

export enum EnrichmentStatus {
  NOT_PROCESSED = 'NOT_PROCESSED',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  SKIPPED = 'SKIPPED',
}

export type EnrichmentRequestRecord = {
  componentName: string;
  componentType: MetadataType;
  requestBody: EnrichmentRequestBody | null;
  response: EnrichMetadataResponse | null;
  message: string | null;
  status: EnrichmentStatus;
};

export const API_ENDPOINT_ENRICHMENT = '/services/data/v66.0/metadata-intelligence/enrichments/on-demand';

export const ENRICHMENT_REQUEST_ENTITY_ENCODING_HEADER = 'X-Chatter-Entity-Encoding';

// Connect API values for supported metadata types
export const API_METADATA_TYPE_CUSTOM_OBJECT = 'CustomObject';
export const API_METADATA_TYPE_FLEXIPAGE = 'FlexiPage';
export const API_METADATA_TYPE_LIGHTNING_TYPE = 'LightningType';
export const API_METADATA_TYPE_LWC = 'Lwc';
export const API_METADATA_TYPE_GENERIC = 'Generic';

export const MAP_SOURCE_COMPONENT_TYPE_TO_METADATA_TYPE: Record<string, string> = {
  [SOURCE_COMPONENT_TYPE_NAME_CUSTOM_OBJECT]: API_METADATA_TYPE_CUSTOM_OBJECT,
  [SOURCE_COMPONENT_TYPE_NAME_FLEXIPAGE]: API_METADATA_TYPE_FLEXIPAGE,
  [SOURCE_COMPONENT_TYPE_NAME_LIGHTNING_TYPE]: API_METADATA_TYPE_LIGHTNING_TYPE,
  [SOURCE_COMPONENT_TYPE_NAME_LWC]: API_METADATA_TYPE_LWC,
  Generic: API_METADATA_TYPE_GENERIC,
};

