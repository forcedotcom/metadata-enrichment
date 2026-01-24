/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import { getMimeTypeFromExtension } from '../../../src/enrichment/enrichmentHandler.js';
import { MIME_TYPES } from '../../../src/enrichment/constants.js';

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
