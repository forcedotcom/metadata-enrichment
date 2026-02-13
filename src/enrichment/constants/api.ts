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

export const API_ENDPOINT_ENRICHMENT = '/services/data/v66.0/metadata-intelligence/enrichments/on-demand';

export const ENRICHMENT_REQUEST_ENTITY_ENCODING_HEADER = 'X-Chatter-Entity-Encoding';

export const METADATA_TYPE_GENERIC = 'Generic';
export const METADATA_TYPE_LWC = 'Lwc';
export const METADATA_TYPE_APEX_CLASS = 'ApexClass';
export const METADATA_TYPE_FLEXIPAGE = 'Flexipage';
export const MAP_SOURCE_COMPONENT_TYPE_TO_METADATA_TYPE: Record<string, string> = {
    ApexClass: METADATA_TYPE_APEX_CLASS,
    Flexipage: METADATA_TYPE_FLEXIPAGE,
    LightningComponentBundle: METADATA_TYPE_LWC,
    Generic: METADATA_TYPE_GENERIC,
};

export const LWC_METADATA_TYPE_NAME = 'LightningComponentBundle';
