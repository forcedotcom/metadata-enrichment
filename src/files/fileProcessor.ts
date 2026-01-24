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

import { readFile } from 'node:fs/promises';
import type { SourceComponent } from '@salesforce/source-deploy-retrieve';
import type { EnrichmentRequestRecord } from '../enrichment/enrichmentHandler.js';
import { getMimeTypeFromExtension } from '../enrichment/enrichmentHandler.js';
import { LwcProcessor } from './lwcProcessor.js';

export type FileReadResult = {
  componentName: string;
  filePath: string;
  fileContents: string;
  mimeType: string;
};

export class FileProcessor {

  public static async updateMetadataFiles(
    componentsToProcess: SourceComponent[],
    enrichmentRecords: EnrichmentRequestRecord[],
  ): Promise<EnrichmentRequestRecord[]> {
    const componentsByType = FileProcessor.groupComponentsByType(componentsToProcess);

    // Only LightningComponentBundle components are supported for now
    const lightningComponentBundles = componentsByType.get('LightningComponentBundle') ?? [];
    if (lightningComponentBundles.length === 0) {
      return enrichmentRecords;
    }
    return LwcProcessor.updateMetadataFiles(lightningComponentBundles, enrichmentRecords);
  }

  public static async readComponentFile(componentName: string, filePath: string): Promise<FileReadResult | null> {
    try {
      const fileContents = await readFile(filePath, 'utf-8');
      const mimeType = getMimeTypeFromExtension(filePath);

      return {
        componentName,
        filePath,
        fileContents,
        mimeType,
      };
    } catch {
      return null;
    }
  }

  public static async readComponentFiles(component: SourceComponent): Promise<FileReadResult[]> {
    const componentName = component.fullName ?? component.name;
    if (!componentName) {
      return [];
    }

    const filePaths = Array.from(component.walkContent());
    const fileReadPromises = filePaths.map((filePath) => FileProcessor.readComponentFile(componentName, filePath));

    const fileResults = await Promise.all(fileReadPromises);
    return fileResults.filter((result): result is FileReadResult => result !== null);
  }

  private static groupComponentsByType(components: SourceComponent[]): Map<string, SourceComponent[]> {
    const componentsByType = new Map<string, SourceComponent[]>();
    for (const component of components) {
      const componentTypeName = component.type?.name ?? 'Unknown';
      const existing = componentsByType.get(componentTypeName) ?? [];
      existing.push(component);
      componentsByType.set(componentTypeName, existing);
    }
    return componentsByType;
  }
}
