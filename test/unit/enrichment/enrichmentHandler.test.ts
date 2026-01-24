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
import { getMimeTypeFromExtension, MIME_TYPES } from '../../../src/enrichment/index.js';

describe('EnrichmentHandler', () => {
  describe('getMimeTypeFromExtension', () => {
    it('should return correct mime type for known extensions', () => {
      expect(getMimeTypeFromExtension('test.js')).to.equal(MIME_TYPES['.js']);
      expect(getMimeTypeFromExtension('test.html')).to.equal(MIME_TYPES['.html']);
      expect(getMimeTypeFromExtension('test.css')).to.equal(MIME_TYPES['.css']);
      expect(getMimeTypeFromExtension('test.xml')).to.equal(MIME_TYPES['.xml']);
      expect(getMimeTypeFromExtension('test.svg')).to.equal(MIME_TYPES['.svg']);
    });

    it('should return default mime type for unknown extensions', () => {
      expect(getMimeTypeFromExtension('test.unknown')).to.equal('application/octet-stream');
      expect(getMimeTypeFromExtension('test')).to.equal('application/octet-stream');
    });

    it('should handle case-insensitive extensions', () => {
      expect(getMimeTypeFromExtension('test.JS')).to.equal(MIME_TYPES['.js']);
      expect(getMimeTypeFromExtension('test.HTML')).to.equal(MIME_TYPES['.html']);
    });

    it('should handle paths with directories', () => {
      expect(getMimeTypeFromExtension('/path/to/file.js')).to.equal(MIME_TYPES['.js']);
      expect(getMimeTypeFromExtension('folder/file.html')).to.equal(MIME_TYPES['.html']);
    });
  });
});
