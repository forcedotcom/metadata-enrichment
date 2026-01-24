/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import type { MetadataType, SourceComponent } from '@salesforce/source-deploy-retrieve';
import type { EnrichmentRequestRecord, EnrichmentResult } from '../../../src/enrichment/enrichmentHandler.js';
import type { FileReadResult } from '../../../src/files/fileProcessor.js';
import { FileProcessor } from '../../../src/files/fileProcessor.js';
import { LwcProcessor } from '../../../src/files/lwcProcessor.js';

describe('LwcProcessor', () => {
  describe('isMetaXmlFile', () => {
    it('should return true for js-meta.xml files', () => {
      expect(LwcProcessor.isMetaXmlFile('component.js-meta.xml')).to.be.true;
      expect(LwcProcessor.isMetaXmlFile('/path/to/component.js-meta.xml')).to.be.true;
    });

    it('should return false for non-meta xml files', () => {
      expect(LwcProcessor.isMetaXmlFile('component.js')).to.be.false;
      expect(LwcProcessor.isMetaXmlFile('component.xml')).to.be.false;
      expect(LwcProcessor.isMetaXmlFile('component.html')).to.be.false;
    });
  });

  describe('updateMetaXml', () => {
    it('should update XML with enrichment result', () => {
      const xmlContent = '<?xml version="1.0"?><LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata"></LightningComponentBundle>';
      const result: EnrichmentResult = {
        resourceId: 'test',
        resourceName: 'test',
        metadataType: 'LightningComponentBundle',
        modelUsed: 'test',
        description: 'Test description',
        descriptionScore: 0.95,
      };

      const updated = LwcProcessor.updateMetaXml(xmlContent, result);

      expect(updated).to.include('Test description');
      expect(updated).to.include('0.95');
      expect(updated).to.include('skipUplift');
    });

    it('should create LightningComponentBundle if missing', () => {
      const xmlContent = '<?xml version="1.0"?><root></root>';
      const result: EnrichmentResult = {
        resourceId: 'test',
        resourceName: 'test',
        metadataType: 'LightningComponentBundle',
        modelUsed: 'test',
        description: 'Test',
        descriptionScore: 0.9,
      };

      const updated = LwcProcessor.updateMetaXml(xmlContent, result);

      expect(updated).to.include('LightningComponentBundle');
    });

    it('should throw SfError on invalid XML', () => {
      const xmlContent = '<invalid><unclosed>';
      const result: EnrichmentResult = {
        resourceId: 'test',
        resourceName: 'test',
        metadataType: 'LightningComponentBundle',
        modelUsed: 'test',
        description: 'Test',
        descriptionScore: 0.9,
      };

      expect(() => LwcProcessor.updateMetaXml(xmlContent, result)).to.throw(SfError);
    });
  });

  describe('readComponentFiles', () => {
    it('should skip components without name or xml', async () => {
      const components: Array<Partial<SourceComponent>> = [
        { fullName: undefined, name: undefined },
        { fullName: 'test', name: 'test', xml: undefined },
      ];

      const result = await LwcProcessor.readComponentFiles(components as SourceComponent[]);

      expect(result).to.be.empty;
    });

    it('should read XML files from components', async () => {
      const originalRead = FileProcessor.readComponentFile.bind(FileProcessor);
      FileProcessor.readComponentFile = async (): Promise<FileReadResult | null> => ({
        componentName: 'test',
        filePath: 'test.xml',
        fileContents: 'content',
        mimeType: 'application/xml',
      });

      const components: Array<Partial<SourceComponent>> = [
        { fullName: 'test', name: 'test', xml: 'test.xml' },
      ];

      const result = await LwcProcessor.readComponentFiles(components as SourceComponent[]);

      expect(result).to.have.length(1);
      FileProcessor.readComponentFile = originalRead;
    });
  });

  describe('updateMetadataFiles', () => {
    it('should skip non-meta XML files', async () => {
      const originalRead = LwcProcessor.readComponentFiles.bind(LwcProcessor);
      LwcProcessor.readComponentFiles = async (): Promise<FileReadResult[]> => [
        {
          componentName: 'test',
          filePath: 'test.js',
          fileContents: 'content',
          mimeType: 'application/javascript',
        },
      ];

      const records: EnrichmentRequestRecord[] = [];
      const result = await LwcProcessor.updateMetadataFiles([], records);

      expect(result).to.equal(records);
      LwcProcessor.readComponentFiles = originalRead;
    });

    it('should skip when skipUplift is enabled', async () => {
      const xmlWithSkipUplift = '<?xml version="1.0"?><LightningComponentBundle><ai><skipUplift>true</skipUplift></ai></LightningComponentBundle>';
      const originalRead = LwcProcessor.readComponentFiles.bind(LwcProcessor);
      LwcProcessor.readComponentFiles = async (): Promise<FileReadResult[]> => [
        {
          componentName: 'test',
          filePath: 'test.js-meta.xml',
          fileContents: xmlWithSkipUplift,
          mimeType: 'application/xml',
        },
      ];

      const mockComponentType: MetadataType = { name: 'LightningComponentBundle' } as MetadataType;
      const mockResult: EnrichmentResult = { metadataType: 'LightningComponentBundle' } as EnrichmentResult;
      const records: EnrichmentRequestRecord[] = [
        {
          componentName: 'test',
          componentType: mockComponentType,
          requestBody: { contentBundles: [], metadataType: 'Generic', maxTokens: 250 },
          response: {
            metadata: { durationMs: 100, failureCount: 0, successCount: 1, timestamp: '' },
            results: [mockResult],
          },
          message: null,
        },
      ];

      const result = await LwcProcessor.updateMetadataFiles([], records);

      expect(result[0].message).to.equal('NO-OP: skipUplift is set to true');
      LwcProcessor.readComponentFiles = originalRead;
    });
  });
});
