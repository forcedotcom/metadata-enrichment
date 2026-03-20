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

import { DEFAULT_XML_METADATA_SCHEMA, CUSTOM_OBJECT_XML_METADATA_SCHEMA } from '../../schemas/index.js';
import type { MetadataTypeConfig } from '../../schemas/index.js';

/*
 * ─── SOURCE COMPONENT TYPE NAMES ───
 * The DX project source component types supported by the metadata enrichment flow.
 * These MUST match to the type names defined in the SDR registry.
 * If the type is not defined in the registry, it is not supported at the DX level.
 * --> https://github.com/forcedotcom/source-deploy-retrieve/blob/main/src/registry/metadataRegistry.json
 * ────────────────────────────────────
 */
export const SOURCE_COMPONENT_TYPE_NAME_CUSTOM_OBJECT = 'CustomObject';
export const SOURCE_COMPONENT_TYPE_NAME_FLEXIPAGE = 'FlexiPage';
export const SOURCE_COMPONENT_TYPE_NAME_LIGHTNING_TYPE = 'LightningTypeBundle';
export const SOURCE_COMPONENT_TYPE_NAME_LWC = 'LightningComponentBundle';

/*
 * ─── CONNECT API METADATA TYPE VALUES ───
 * The metadata type values sent in Connect API enrichment requests to the org.
 * These can differ from the source component type names above.
 * ────────────────────────────────────
 */
export const API_METADATA_TYPE_CUSTOM_OBJECT = 'CustomObject';
export const API_METADATA_TYPE_FLEXIPAGE = 'FlexiPage';
export const API_METADATA_TYPE_LIGHTNING_TYPE = 'LightningType';
export const API_METADATA_TYPE_LWC = 'Lwc';
export const API_METADATA_TYPE_GENERIC = 'Generic';

// ─── TYPE REGISTRY ───
// A registry of supported types for metadata enrichment.
// Defines supported component types, their Connect API metadata type mapping,
// and the XML schema for writing to metadata.
//
// To add a new type:
//   1. Add SOURCE_COMPONENT_TYPE_NAME_* above  (SDR name)
//   2. Add API_METADATA_TYPE_* above           (Connect API value)
//   3. Add an entry below
//   4. If the XML structure differs from the default <ai> block, define a new
//      MetadataTypeXmlSchema in src/schemas/schemas.ts; otherwise use DEFAULT_XML_METADATA_SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const METADATA_TYPE_CONFIGS: Record<string, MetadataTypeConfig> = {
  // Source Component Type → Connect API Metadata Type, Metadata XML Schema
  [SOURCE_COMPONENT_TYPE_NAME_CUSTOM_OBJECT]: {
    apiType: API_METADATA_TYPE_CUSTOM_OBJECT,
    xmlSchema: CUSTOM_OBJECT_XML_METADATA_SCHEMA,
  },
  [SOURCE_COMPONENT_TYPE_NAME_FLEXIPAGE]: {
    apiType: API_METADATA_TYPE_FLEXIPAGE,
    xmlSchema: DEFAULT_XML_METADATA_SCHEMA,
  },
  [SOURCE_COMPONENT_TYPE_NAME_LIGHTNING_TYPE]: {
    apiType: API_METADATA_TYPE_LIGHTNING_TYPE,
    xmlSchema: DEFAULT_XML_METADATA_SCHEMA,
  },
  [SOURCE_COMPONENT_TYPE_NAME_LWC]: { apiType: API_METADATA_TYPE_LWC, xmlSchema: DEFAULT_XML_METADATA_SCHEMA },
};

// Do not edit the below. These mappers are derived from the above configs.
export const SUPPORTED_COMPONENT_TYPES: ReadonlySet<string> = new Set(Object.keys(METADATA_TYPE_CONFIGS));
export const MAP_SOURCE_COMPONENT_TYPE_TO_METADATA_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(METADATA_TYPE_CONFIGS).map(([sourceType, config]) => [sourceType, config.apiType])
);
