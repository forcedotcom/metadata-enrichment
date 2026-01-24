/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import type { MetadataType } from '@salesforce/source-deploy-retrieve';
import type { ComponentEnrichmentStatus } from '../../../src/common/types.js';
import type { EnrichmentRequestRecord, EnrichmentRequestBody, EnrichmentResult } from '../../../src/enrichment/enrichmentHandler.js';
import { EnrichmentMetrics } from '../../../src/enrichment/enrichmentMetrics.js';

describe('EnrichmentMetrics', () => {
  describe('initialization', () => {
    it('should initialize all metrics to zero', () => {
      const metrics = new EnrichmentMetrics();
      expect(metrics.success.count).to.equal(0);
      expect(metrics.success.components).to.be.empty;
      expect(metrics.fail.count).to.equal(0);
      expect(metrics.fail.components).to.be.empty;
      expect(metrics.skipped.count).to.equal(0);
      expect(metrics.skipped.components).to.be.empty;
      expect(metrics.total).to.equal(0);
    });
  });

  describe('successful components', () => {
    it('should add component to success list and increment counts', () => {
      const metrics = new EnrichmentMetrics();
      const component: ComponentEnrichmentStatus = {
        type: 'LightningComponentBundle',
        componentName: 'testComponent',
        message: 'Success',
      };

      metrics.addSuccessComponent(component);

      expect(metrics.success.count).to.equal(1);
      expect(metrics.success.components).to.include(component);
      expect(metrics.total).to.equal(1);
    });
  });

  describe('failed components', () => {
    it('should add component to fail list and increment counts', () => {
      const metrics = new EnrichmentMetrics();
      const component: ComponentEnrichmentStatus = {
        type: 'LightningComponentBundle',
        componentName: 'testComponent',
        message: 'Failed',
      };

      metrics.addFailComponent(component);

      expect(metrics.fail.count).to.equal(1);
      expect(metrics.fail.components).to.include(component);
      expect(metrics.total).to.equal(1);
    });
  });

  describe('skipped components', () => {
    it('should add component to skipped list and increment counts', () => {
      const metrics = new EnrichmentMetrics();
      const component: ComponentEnrichmentStatus = {
        type: 'LightningComponentBundle',
        componentName: 'testComponent',
        message: 'Skipped',
      };

      metrics.addSkippedComponent(component);

      expect(metrics.skipped.count).to.equal(1);
      expect(metrics.skipped.components).to.include(component);
      expect(metrics.total).to.equal(1);
    });
  });

  describe('creating from records', () => {
    it('should categorize records with response as success', () => {
      const mockComponentType: MetadataType = { name: 'LightningComponentBundle' } as MetadataType;
      const mockRequestBody: EnrichmentRequestBody = { contentBundles: [], metadataType: 'Generic', maxTokens: 250 };
      const mockResult: EnrichmentResult = { metadataType: 'LightningComponentBundle' } as EnrichmentResult;
      const records: EnrichmentRequestRecord[] = [
        {
          componentName: 'component1',
          componentType: mockComponentType,
          requestBody: mockRequestBody,
          response: {
            metadata: { durationMs: 100, failureCount: 0, successCount: 1, timestamp: '' },
            results: [mockResult],
          },
          message: null,
        },
      ];

      const metrics = EnrichmentMetrics.createEnrichmentMetrics(records);

      expect(metrics.success.count).to.equal(1);
      expect(metrics.fail.count).to.equal(0);
      expect(metrics.total).to.equal(1);
      expect(metrics.success.components[0].componentName).to.equal('component1');
    });

    it('should categorize records without response as fail', () => {
      const mockComponentType: MetadataType = { name: 'LightningComponentBundle' } as MetadataType;
      const mockRequestBody: EnrichmentRequestBody = { contentBundles: [], metadataType: 'Generic', maxTokens: 250 };
      const records: EnrichmentRequestRecord[] = [
        {
          componentName: 'component1',
          componentType: mockComponentType,
          requestBody: mockRequestBody,
          response: null,
          message: 'Error occurred',
        },
      ];

      const metrics = EnrichmentMetrics.createEnrichmentMetrics(records);

      expect(metrics.success.count).to.equal(0);
      expect(metrics.fail.count).to.equal(1);
      expect(metrics.total).to.equal(1);
      expect(metrics.fail.components[0].message).to.equal('Error occurred');
    });

    it('should handle skipped components', () => {
      const records: EnrichmentRequestRecord[] = [];
      const skipped: ComponentEnrichmentStatus[] = [
        {
          type: 'LightningComponentBundle',
          componentName: 'skipped1',
          message: 'Skipped',
        },
      ];

      const metrics = EnrichmentMetrics.createEnrichmentMetrics(records, skipped);

      expect(metrics.skipped.count).to.equal(1);
      expect(metrics.skipped.components).to.include(skipped[0]);
      expect(metrics.total).to.equal(1);
    });

    it('should use metadataType from response when componentType is not available', () => {
      const mockRequestBody: EnrichmentRequestBody = { contentBundles: [], metadataType: 'Generic', maxTokens: 250 };
      const mockResult: EnrichmentResult = { metadataType: 'ApexClass' } as EnrichmentResult;
      const records: EnrichmentRequestRecord[] = [
        {
          componentName: 'component1',
          componentType: null as unknown as MetadataType,
          requestBody: mockRequestBody,
          response: {
            metadata: { durationMs: 100, failureCount: 0, successCount: 1, timestamp: '' },
            results: [mockResult],
          },
          message: null,
        },
      ];

      const metrics = EnrichmentMetrics.createEnrichmentMetrics(records);

      expect(metrics.success.components[0].type).to.equal('ApexClass');
    });
  });
});
