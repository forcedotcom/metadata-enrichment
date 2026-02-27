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
import type { SourceComponent } from '@salesforce/source-deploy-retrieve';
import { LwcComponentValidator } from '../../../src/enrichment/validators/lwcComponentValidator.js';

describe('LwcComponentValidator', () => {
  it('should return true when the component has a metadata XML file', () => {
    const component = { xml: 'myComponent.js-meta.xml' } as SourceComponent;
    expect(LwcComponentValidator.validate(component)).to.be.true;
  });

  it('should return false when the component has no metadata XML file', () => {
    const component = { xml: undefined } as unknown as SourceComponent;
    expect(LwcComponentValidator.validate(component)).to.be.false;
  });
});
