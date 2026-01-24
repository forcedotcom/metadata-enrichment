/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import type { MetadataType, SourceComponent } from '@salesforce/source-deploy-retrieve';
import type { EnrichmentRequestRecord } from '../../../src/enrichment/enrichmentHandler.js';
import type { FileReadResult } from '../../../src/files/fileProcessor.js';
import { FileProcessor } from '../../../src/files/fileProcessor.js';
import { LwcProcessor } from '../../../src/files/lwcProcessor.js';

describe('FileProcessor', () => {
  describe('readComponentFile', () => {
    it('should read file and return FileReadResult', async () => {
      const result = await FileProcessor.readComponentFile('testComponent', 'package.json');

      expect(result).to.not.be.null;
      expect(result?.componentName).to.equal('testComponent');
      expect(result?.filePath).to.equal('package.json');
      expect(result?.fileContents).to.be.a('string');
      expect(result?.mimeType).to.be.a('string');
    });

    it('should return null when file does not exist', async () => {
      const result = await FileProcessor.readComponentFile('testComponent', 'nonexistent-file.txt');

      expect(result).to.be.null;
    });
  });

  describe('readComponentFiles', () => {
    it('should return empty array when component has no name', async () => {
      const component: Partial<SourceComponent> = {
        fullName: undefined,
        name: undefined,
      };

      const result = await FileProcessor.readComponentFiles(component as SourceComponent);

      expect(result).to.be.empty;
    });

    it('should read files from component walkContent', async () => {
      const mockFilePaths = ['file1.js', 'file2.html'];
      const component: Partial<SourceComponent> = {
        fullName: 'testComponent',
        name: 'testComponent',
        walkContent: () => mockFilePaths,
      };

      // Mock readComponentFile to return valid results for existing files
      const originalRead = FileProcessor.readComponentFile.bind(FileProcessor);
      FileProcessor.readComponentFile = async (name: string, path: string): Promise<FileReadResult | null> => {
        if (path === 'file1.js' || path === 'file2.html') {
          return {
            componentName: name,
            filePath: path,
            fileContents: 'content',
            mimeType: 'text/plain',
          };
        }
        return null;
      };

      const result = await FileProcessor.readComponentFiles(component as SourceComponent);

      expect(result.length).to.be.greaterThan(0);
      FileProcessor.readComponentFile = originalRead;
    });
  });

  describe('updateMetadataFiles', () => {
    it('should return enrichment records when no LightningComponentBundle components', async () => {
      const mockType: MetadataType = { name: 'ApexClass' } as MetadataType;
      const components: SourceComponent[] = [
        { type: mockType } as SourceComponent,
      ];
      const records: EnrichmentRequestRecord[] = [];

      const result = await FileProcessor.updateMetadataFiles(components, records);

      expect(result).to.equal(records);
    });

    it('should delegate to LwcProcessor for LightningComponentBundle components', async () => {
      const mockType: MetadataType = { name: 'LightningComponentBundle' } as MetadataType;
      const components: SourceComponent[] = [
        { type: mockType } as SourceComponent,
      ];
      const records: EnrichmentRequestRecord[] = [
        {
          componentName: 'test',
          componentType: mockType,
          requestBody: { contentBundles: [], metadataType: 'Generic', maxTokens: 250 },
          response: null,
          message: null,
        },
      ];

      const originalUpdate = LwcProcessor.updateMetadataFiles.bind(LwcProcessor);
      LwcProcessor.updateMetadataFiles = async (): Promise<EnrichmentRequestRecord[]> => records;

      const result = await FileProcessor.updateMetadataFiles(components, records);

      expect(result).to.equal(records);
      LwcProcessor.updateMetadataFiles = originalUpdate;
    });
  });
});
