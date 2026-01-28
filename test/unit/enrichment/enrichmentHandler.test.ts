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
import type { Connection } from '@salesforce/core';
import type { MetadataType, SourceComponent } from '@salesforce/source-deploy-retrieve';
import type { EnrichMetadataResult, EnrichmentResult } from '../../../src/enrichment/types/index.js';
import { EnrichmentHandler, getMimeTypeFromExtension, EnrichmentStatus } from '../../../src/enrichment/enrichmentHandler.js';
import { LWC_MIME_TYPES } from '../../../src/enrichment/constants/index.js';
import { FileProcessor } from '../../../src/files/index.js';
import type { FileReadResult } from '../../../src/files/index.js';

const mimeTypes: Record<string, string> = LWC_MIME_TYPES;

describe('EnrichmentHandler', () => {
  describe('getMimeTypeFromExtension', () => {
    it('should return correct mime type for known extensions', () => {
      expect(getMimeTypeFromExtension('test.js')).to.equal(mimeTypes['.js']);
      expect(getMimeTypeFromExtension('test.html')).to.equal(mimeTypes['.html']);
      expect(getMimeTypeFromExtension('test.css')).to.equal(mimeTypes['.css']);
      expect(getMimeTypeFromExtension('test.xml')).to.equal(mimeTypes['.xml']);
      expect(getMimeTypeFromExtension('test.svg')).to.equal(mimeTypes['.svg']);
    });

    it('should return default mime type for unknown extensions', () => {
      expect(getMimeTypeFromExtension('test.unknown')).to.equal('application/octet-stream');
      expect(getMimeTypeFromExtension('test')).to.equal('application/octet-stream');
    });

    it('should handle case-insensitive extensions', () => {
      expect(getMimeTypeFromExtension('test.JS')).to.equal(mimeTypes['.js']);
      expect(getMimeTypeFromExtension('test.HTML')).to.equal(mimeTypes['.html']);
    });

    it('should handle paths with directories', () => {
      expect(getMimeTypeFromExtension('/path/to/file.js')).to.equal(mimeTypes['.js']);
      expect(getMimeTypeFromExtension('folder/file.html')).to.equal(mimeTypes['.html']);
    });
  });

  describe('enrich', () => {
    it('should skip components without names', async () => {
      const mockConnection = {
        requestPost: async (): Promise<EnrichMetadataResult> => {
          throw new Error('Should not be called');
        },
      } as unknown as Connection;

      const components: SourceComponent[] = [
        { fullName: undefined, name: undefined } as unknown as SourceComponent,
      ];

      const result = await EnrichmentHandler.enrich(mockConnection, components);

      expect(result).to.be.empty;
    });

    it('should skip components without files', async () => {
      const mockConnection = {
        requestPost: async (): Promise<EnrichMetadataResult> => {
          throw new Error('Should not be called');
        },
      } as unknown as Connection;

      const originalRead = FileProcessor.readComponentFiles.bind(FileProcessor);
      FileProcessor.readComponentFiles = async (): Promise<FileReadResult[]> => [];

      const components: SourceComponent[] = [
        { fullName: 'testComponent', name: 'testComponent' } as unknown as SourceComponent,
      ];

      const result = await EnrichmentHandler.enrich(mockConnection, components);

      expect(result).to.be.empty;
      FileProcessor.readComponentFiles = originalRead;
    });

    it('should successfully enrich components', async () => {
      const mockResult: EnrichmentResult = {
        resourceId: 'test-id',
        resourceName: 'testComponent',
        metadataType: 'LightningComponentBundle',
        modelUsed: 'test-model',
        description: 'Test description',
        descriptionScore: 0.95,
      };

      const mockResponse: EnrichMetadataResult = {
        metadata: {
          durationMs: 100,
          failureCount: 0,
          successCount: 1,
          timestamp: '2026-01-27T00:00:00Z',
        },
        results: [mockResult],
      };

      const mockConnection = {
        requestPost: async (): Promise<EnrichMetadataResult> => mockResponse,
      } as unknown as Connection;

      const mockType: MetadataType = { name: 'LightningComponentBundle' } as MetadataType;
      const mockFiles: FileReadResult[] = [
        {
          componentName: 'testComponent',
          filePath: 'test.js',
          fileContents: 'console.log("test");',
          mimeType: 'application/javascript',
        },
      ];

      const originalRead = FileProcessor.readComponentFiles.bind(FileProcessor);
      FileProcessor.readComponentFiles = async (): Promise<FileReadResult[]> => mockFiles;

      const components: SourceComponent[] = [
        { fullName: 'testComponent', name: 'testComponent', type: mockType } as SourceComponent,
      ];

      const result = await EnrichmentHandler.enrich(mockConnection, components);

      expect(result).to.have.length(1);
      expect(result[0].componentName).to.equal('testComponent');
      expect(result[0].status).to.equal(EnrichmentStatus.SUCCESS);
      expect(result[0].response).to.not.be.null;
      expect(result[0].response?.results[0]).to.deep.equal(mockResult);
      FileProcessor.readComponentFiles = originalRead;
    });

    it('should handle failed enrichment requests', async () => {
      const mockConnection = {
        requestPost: async (): Promise<EnrichMetadataResult> => {
          throw new Error('API request failed');
        },
      } as unknown as Connection;

      const mockType: MetadataType = { name: 'LightningComponentBundle' } as MetadataType;
      const mockFiles: FileReadResult[] = [
        {
          componentName: 'testComponent',
          filePath: 'test.js',
          fileContents: 'console.log("test");',
          mimeType: 'application/javascript',
        },
      ];

      const originalRead = FileProcessor.readComponentFiles.bind(FileProcessor);
      FileProcessor.readComponentFiles = async (): Promise<FileReadResult[]> => mockFiles;

      const components: SourceComponent[] = [
        { fullName: 'testComponent', name: 'testComponent', type: mockType } as unknown as SourceComponent,
      ];

      const result = await EnrichmentHandler.enrich(mockConnection, components);

      expect(result).to.have.length(1);
      expect(result[0].componentName).to.equal('testComponent');
      expect(result[0].status).to.equal(EnrichmentStatus.FAIL);
      expect(result[0].response).to.be.null;
      expect(result[0].message).to.include('API request failed');
      FileProcessor.readComponentFiles = originalRead;
    });

    it('should handle mixed success and failure scenarios', async () => {
      let callCount = 0;
      const mockConnection = {
        requestPost: async (): Promise<EnrichMetadataResult> => {
          callCount++;
          if (callCount === 1) {
            return {
              metadata: {
                durationMs: 100,
                failureCount: 0,
                successCount: 1,
                timestamp: '2026-01-27T00:00:00Z',
              },
              results: [
                {
                  resourceId: 'test-id-1',
                  resourceName: 'testComponent1',
                  metadataType: 'LightningComponentBundle',
                  modelUsed: 'test-model',
                  description: 'Test description 1',
                  descriptionScore: 0.95,
                },
              ],
            };
          }
          throw new Error('API request failed');
        },
      } as unknown as Connection;

      const mockType: MetadataType = { name: 'LightningComponentBundle' } as MetadataType;
      const mockFiles: FileReadResult[] = [
        {
          componentName: 'testComponent',
          filePath: 'test.js',
          fileContents: 'console.log("test");',
          mimeType: 'application/javascript',
        },
      ];

      const originalRead = FileProcessor.readComponentFiles.bind(FileProcessor);
      FileProcessor.readComponentFiles = async (): Promise<FileReadResult[]> => mockFiles;

      const components: SourceComponent[] = [
        { fullName: 'testComponent1', name: 'testComponent1', type: mockType } as unknown as SourceComponent,
        { fullName: 'testComponent2', name: 'testComponent2', type: mockType } as unknown as SourceComponent,
      ];

      const result = await EnrichmentHandler.enrich(mockConnection, components);

      expect(result).to.have.length(2);
      expect(result[0].status).to.equal(EnrichmentStatus.SUCCESS);
      expect(result[0].response).to.not.be.null;
      expect(result[1].status).to.equal(EnrichmentStatus.FAIL);
      expect(result[1].response).to.be.null;
      FileProcessor.readComponentFiles = originalRead;
    });
  });
});
