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

import { basename, extname } from 'node:path';
import type { Connection } from '@salesforce/core';
import { SfError } from '@salesforce/core';
import { Messages } from '@salesforce/core/messages';
import type { MetadataType, SourceComponent } from '@salesforce/source-deploy-retrieve';
import { FileProcessor } from '../files/index.js';
import type { FileReadResult } from '../files/index.js';
import { API_ENDPOINT_ENRICHMENT, LWC_METADATA_TYPE_NAME, LWC_MIME_TYPES } from './constants/index.js';
import type {
  ContentBundleFile,
  ContentBundle,
  EnrichmentRequestBody,
  EnrichMetadataResult,
} from './types/index.js';

Messages.importMessagesDirectory(import.meta.dirname);
const messages = Messages.loadMessages('@salesforce/metadata-enrichment', 'enrichment');

export enum EnrichmentStatus {
  NOT_PROCESSED = 'NOT_PROCESSED',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  SKIPPED = 'SKIPPED',
}

export type EnrichmentRequestRecord = {
  componentName: string;
  componentType: MetadataType;
  requestBody: EnrichmentRequestBody | null;
  response: EnrichMetadataResult | null;
  message: string | null;
  status: EnrichmentStatus;
};

export function getMimeTypeFromExtension(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return LWC_MIME_TYPES[ext] || 'application/octet-stream';
}

export class EnrichmentHandler {
  /**
   * Processes and sends metadata enrichment requests for the input source components in the project.
   *
   * @param connection Salesforce connection instance
   * @param sourceComponents Array of source components to enrich
   * @returns Promise resolving to enrichment request records
   */
  public static async enrich(
    connection: Connection,
    sourceComponents: SourceComponent[],
  ): Promise<EnrichmentRequestRecord[]> {

    // Enrichment is only conducted for LWC components; non-LWC components are returned as SKIPPED
    const lwcComponents: SourceComponent[] = [];
    const nonLwcComponents: SourceComponent[] = [];
    for (const component of sourceComponents) {
      if (component.type?.name === LWC_METADATA_TYPE_NAME) {
        lwcComponents.push(component);
      } else {
        nonLwcComponents.push(component);
      }
    }

    const lwcRecords = await EnrichmentHandler.createEnrichmentRequestRecords(lwcComponents);
    const nonLwcRecords = await EnrichmentHandler.createEnrichmentRequestRecords(
      nonLwcComponents, EnrichmentStatus.SKIPPED, messages.getMessage('error.enrich.lwc.only'));

    const enrichmentResults = await EnrichmentHandler.sendEnrichmentRequests(connection, lwcRecords);

    return [...enrichmentResults, ...nonLwcRecords];
  }

  private static async createEnrichmentRequestRecord(
    component: SourceComponent,
    status?: EnrichmentStatus,
    message?: string | null
  ): Promise<EnrichmentRequestRecord> {
    const componentName = component.fullName ?? component.name;
    const files = await FileProcessor.readComponentFiles(component);
      if (files.length === 0) {
        return {
          componentName,
          componentType: component.type ?? null,
          requestBody: null,
          response: null,
          message: messages.getMessage('error.file.read.failed', [componentName]),
          status: EnrichmentStatus.SKIPPED,
        };
      }

      const contentBundle = EnrichmentHandler.createContentBundle(componentName, files);
      const requestBody = EnrichmentHandler.createEnrichmentRequestBody(contentBundle);

      return {
        componentName,
        componentType: component.type ?? null,
        requestBody,
        response: null,
        message: message ?? null,
        status: status ?? EnrichmentStatus.NOT_PROCESSED,
      };
  }

  private static async createEnrichmentRequestRecords(
    components: SourceComponent[],
    status?: EnrichmentStatus,
    message?: string | null,
  ): Promise<EnrichmentRequestRecord[]> {
    const recordPromises = components.map(async (component): Promise<EnrichmentRequestRecord | null> => {
      const componentName = component.fullName ?? component.name;
      if (!componentName) {
        return null;
      }

      return EnrichmentHandler.createEnrichmentRequestRecord(component, status, message);
    });

    const results = await Promise.all(recordPromises);
    return results.filter((r): r is EnrichmentRequestRecord => r !== null);
  }

  private static createContentBundleFile(file: FileReadResult): ContentBundleFile {
    return {
      filename: basename(file.filePath),
      mimeType: file.mimeType,
      content: file.fileContents,
      encoding: 'PlainText',
    };
  }

  private static createContentBundle(componentName: string, files: FileReadResult[]): ContentBundle {
    const contentBundleFiles: Record<string, ContentBundleFile> = {};

    for (const file of files) {
      const contentBundleFile = EnrichmentHandler.createContentBundleFile(file);
      contentBundleFiles[contentBundleFile.filename] = contentBundleFile;
    }

    return {
      resourceName: componentName,
      files: contentBundleFiles,
    };
  }

  private static createEnrichmentRequestBody(contentBundle: ContentBundle): EnrichmentRequestBody {
    return {
      contentBundles: [contentBundle],
      metadataType: 'Generic',
      maxTokens: 250,
    };
  }

  private static async sendEnrichmentRequest(
    connection: Connection,
    record: EnrichmentRequestRecord,
  ): Promise<EnrichmentRequestRecord> {
    try {
      const response: EnrichMetadataResult = await connection.requestPost(API_ENDPOINT_ENRICHMENT, record.requestBody ?? {});
      return {
        ...record,
        response,
        status: EnrichmentStatus.SUCCESS,
      };
    } catch (error) {
      throw new SfError(messages.getMessage('error.enrichment.request', [record.componentName]));
    }
  }

  private static async sendEnrichmentRequests(
    connection: Connection,
    records: EnrichmentRequestRecord[],
  ): Promise<EnrichmentRequestRecord[]> {
    const requestPromises = records.map((record) => EnrichmentHandler.sendEnrichmentRequest(connection, record));

    const requestResults = await Promise.allSettled(requestPromises);

    return requestResults.map((result, index) => {
      // If the request was successful, return the record with the response populated
      if (result.status === 'fulfilled') {
        return result.value;
      }
      // If the request was not successful, capture the error message
      const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
      return {
        ...records[index],
        response: null,
        message: errorMessage,
        status: EnrichmentStatus.FAIL,
      };
    });
  }
}
