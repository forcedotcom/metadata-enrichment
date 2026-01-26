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

import { basename } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { SfError } from '@salesforce/core';
import { Messages } from '@salesforce/core/messages';
import type { SourceComponent } from '@salesforce/source-deploy-retrieve';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type { EnrichmentRequestRecord } from '../enrichment/enrichmentHandler.js';
import type { EnrichmentResult } from '../enrichment/types/index.js';
import { EnrichmentStatus } from '../enrichment/enrichmentHandler.js';
import type { FileReadResult } from './fileProcessor.js';
import { FileProcessor } from './fileProcessor.js';

const messages = Messages.loadMessages('@salesforce/metadata-enrichment', 'enrichment');

export class LwcProcessor {
  public static async readComponentFiles(sourceComponents: SourceComponent[]): Promise<FileReadResult[]> {
    const fileReadPromises: Array<Promise<FileReadResult | null>> = [];

    for (const component of sourceComponents) {
      const componentName = component.fullName ?? component.name;
      if (!componentName || !component.xml) {
        continue;
      }

      fileReadPromises.push(FileProcessor.readComponentFile(componentName, component.xml));
    }

    const fileResults = await Promise.all(fileReadPromises);
    return fileResults.filter((result): result is FileReadResult => result !== null);
  }

  public static async updateMetadataFiles(
    lightningComponentBundles: SourceComponent[],
    enrichmentRecords: Set<EnrichmentRequestRecord>,
  ): Promise<Set<EnrichmentRequestRecord>> {
    const fileContents = await LwcProcessor.readComponentFiles(lightningComponentBundles);

    for (const file of fileContents) {
      if (!LwcProcessor.isMetaXmlFile(file.filePath)) {
        continue;
      }

      let enrichmentRecord: EnrichmentRequestRecord | undefined;
      for (const record of enrichmentRecords) {
        if (record.componentName === file.componentName) {
          enrichmentRecord = record;
          break;
        }
      }

      if (!enrichmentRecord?.response) {
        continue;
      }

      const enrichmentResult = enrichmentRecord.response.results[0];
      if (!enrichmentResult) {
        continue;
      }

      // Check if skipUplift is enabled before processing
      if (LwcProcessor.isSkipUpliftEnabled(file.fileContents)) {
        enrichmentRecord.message = 'skipUplift is set to true';
        enrichmentRecord.status = EnrichmentStatus.SKIPPED;
        continue;
      }

      try {
        const updatedXml = LwcProcessor.updateMetaXml(file.fileContents, enrichmentResult);
        // eslint-disable-next-line no-await-in-loop
        await writeFile(file.filePath, updatedXml, 'utf-8');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        enrichmentRecord.message = errorMessage;
      }
    }

    return enrichmentRecords;
  }

  public static updateMetaXml(xmlContent: string, result: EnrichmentResult): string {
    const parser = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: false,
      trimValues: true,
    });
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });

    try {
      const xmlObj = parser.parse(xmlContent) as {
        LightningComponentBundle?: {
          ai?: {
            skipUplift?: string | boolean;
            description?: string;
            score?: string;
          };
        };
      };

      if (!xmlObj.LightningComponentBundle) {
        xmlObj.LightningComponentBundle = {};
      }

      xmlObj.LightningComponentBundle.ai = {
        skipUplift: 'false',
        description: result.description,
        score: String(result.descriptionScore),
      };

      const builtXml = builder.build(xmlObj);
      return builtXml.trim().replace(/\n{3,}/g, '\n\n');
    } catch (error) {
      throw new SfError(messages.getMessage('error_parsing_xml', [error instanceof Error ? error.message : String(error)]));
    }
  }

  public static isMetaXmlFile(filePath: string): boolean {
    const fileName = basename(filePath);
    return fileName.endsWith('.js-meta.xml');
  }

  private static isSkipUpliftEnabled(xmlContent: string): boolean {
    try {
      const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: false, trimValues: true });
      const xmlObj = parser.parse(xmlContent) as {
        LightningComponentBundle?: { ai?: { skipUplift?: string | boolean } };
      };

      const skipUplift = xmlObj.LightningComponentBundle?.ai?.skipUplift;
      return skipUplift === true || String(skipUplift).toLowerCase() === 'true';
    } catch {
      return false;
    }
  }
}
