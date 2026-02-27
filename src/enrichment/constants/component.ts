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

import type { SourceComponent } from '@salesforce/source-deploy-retrieve';
import { LwcComponentValidator } from '../validators/index.js';

export const LWC_METADATA_TYPE_NAME = 'LightningComponentBundle';

export const SUPPORTED_COMPONENT_TYPES: ReadonlySet<string> = new Set([LWC_METADATA_TYPE_NAME]);

/**
 * Maps component type names to a validator function that determines if the component
 * meets the requirements for enrichment processing.
 * Returns true if the component is valid, false if it should be skipped.
 */
export const COMPONENT_TYPE_VALIDATORS: ReadonlyMap<string, (component: SourceComponent) => boolean> = new Map([
  // eslint-disable-next-line @typescript-eslint/unbound-method
  [LWC_METADATA_TYPE_NAME, LwcComponentValidator.validate],
]);
