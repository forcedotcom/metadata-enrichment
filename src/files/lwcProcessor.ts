/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { basename } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { SfError } from '@salesforce/core';
import type { SourceComponent } from '@salesforce/source-deploy-retrieve';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type { EnrichmentRequestRecord, EnrichmentResult } from '../enrichment/enrichmentHandler.js';
import type { FileReadResult } from './fileProcessor.js';
import { FileProcessor } from './fileProcessor.js';

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
    enrichmentRecords: EnrichmentRequestRecord[],
  ): Promise<EnrichmentRequestRecord[]> {
    const fileContents = await LwcProcessor.readComponentFiles(lightningComponentBundles);

    for (const file of fileContents) {
      if (!LwcProcessor.isMetaXmlFile(file.filePath)) {
        continue;
      }

      const enrichmentRecord = enrichmentRecords.find((record) => record.componentName === file.componentName);
      if (!enrichmentRecord?.response) {
        continue;
      }

      const enrichmentResult = enrichmentRecord.response.results[0];
      if (!enrichmentResult) {
        continue;
      }

      // Check if skipUplift is enabled before processing
      if (LwcProcessor.isSkipUpliftEnabled(file.fileContents)) {
        enrichmentRecord.message = 'NO-OP: skipUplift is set to true';
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

      const builtXml = builder.build(xmlObj) as string;
      return builtXml.trim().replace(/\n{3,}/g, '\n\n');
    } catch (error) {
      throw new SfError(`Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`);
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
