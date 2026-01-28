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
import type { MetadataType, SourceComponent } from '@salesforce/source-deploy-retrieve';
import type { EnrichmentRequestRecord, FileReadResult } from '../../../src/index.js';
import { FileProcessor, EnrichmentStatus } from '../../../src/index.js';
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
      const records = new Set<EnrichmentRequestRecord>();

      const result = await FileProcessor.updateMetadataFiles(components, records);

      expect(result).to.equal(records);
    });

    it('should delegate to LwcProcessor for LightningComponentBundle components', async () => {
      const mockType: MetadataType = { name: 'LightningComponentBundle' } as MetadataType;
      const components: SourceComponent[] = [
        { type: mockType } as SourceComponent,
      ];
      const record: EnrichmentRequestRecord = {
        componentName: 'test',
        componentType: mockType,
        requestBody: { contentBundles: [], metadataType: 'Generic', maxTokens: 250 },
        response: null,
        message: null,
        status: EnrichmentStatus.FAIL,
      };
      const records = new Set<EnrichmentRequestRecord>([record]);

      const originalUpdate = LwcProcessor.updateMetadataFiles.bind(LwcProcessor);
      LwcProcessor.updateMetadataFiles = async (): Promise<Set<EnrichmentRequestRecord>> => records;

      const result = await FileProcessor.updateMetadataFiles(components, records);

      expect(result).to.equal(records);
      LwcProcessor.updateMetadataFiles = originalUpdate;
    });
  });
});
