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

import { expect } from 'chai';
import {
  SUPPORTED_COMPONENT_TYPES,
  SOURCE_COMPONENT_TYPE_NAME_CUSTOM_OBJECT,
  SOURCE_COMPONENT_TYPE_NAME_LWC,
} from '../../../src/enrichment/constants/supportedTypes.js';

describe('SUPPORTED_COMPONENT_TYPES', () => {
  it('contains exactly CustomObject and LightningComponentBundle', () => {
    expect(SUPPORTED_COMPONENT_TYPES.size).to.equal(2);
    expect(SUPPORTED_COMPONENT_TYPES.has(SOURCE_COMPONENT_TYPE_NAME_CUSTOM_OBJECT)).to.be.true;
    expect(SUPPORTED_COMPONENT_TYPES.has(SOURCE_COMPONENT_TYPE_NAME_LWC)).to.be.true;
  });

  it('does not include removed types FlexiPage and LightningTypeBundle', () => {
    expect(SUPPORTED_COMPONENT_TYPES.has('FlexiPage')).to.be.false;
    expect(SUPPORTED_COMPONENT_TYPES.has('LightningTypeBundle')).to.be.false;
  });
});
