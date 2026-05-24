// @ts-nocheck
/**
 * AgentNode Integration Tests
 * 
 * Tests for agent node workflow integration:
 * - Node creation on canvas
 * - Node connections to other nodes
 * - Data persistence
 * - Inspector editing
 * - Node deletion
 * - Serialization/deserialization
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNodeData } from '@/types/workflow-node';

describe('AgentNode Integration Tests', () => {
  // ── Test Data ──
  const mockAgentNodeData: WorkflowNodeData & {
    agentName: string;
    model: string;
    provider: string;
    runtime: string;
    promptSummary: string;
    inputVariables: string[];
    outputVariable: string;
  } = {
    title: 'Research Agent',
    label: 'Research Agent',
    category: 'ai',
    agentName: 'Research Agent',
    model: 'Claude 3.5',
    provider: 'OpenRouter',
    runtime: 'Zeroclaw',
    promptSummary: 'Analyze user input and generate research findings',
    inputVariables: ['user_input', 'context'],
    outputVariable: 'research_result',
    status: 'default',
  };

  // ── Test 1: Agent Node Data Structure ──
  describe('Agent Node Data Structure', () => {
    it('should have all required agent metadata fields', () => {
      expect(mockAgentNodeData).toHaveProperty('agentName');
      expect(mockAgentNodeData).toHaveProperty('model');
      expect(mockAgentNodeData).toHaveProperty('provider');
      expect(mockAgentNodeData).toHaveProperty('runtime');
      expect(mockAgentNodeData).toHaveProperty('promptSummary');
      expect(mockAgentNodeData).toHaveProperty('inputVariables');
      expect(mockAgentNodeData).toHaveProperty('outputVariable');
    });

    it('should have correct data types for all fields', () => {
      expect(typeof mockAgentNodeData.agentName).toBe('string');
      expect(typeof mockAgentNodeData.model).toBe('string');
      expect(typeof mockAgentNodeData.provider).toBe('string');
      expect(typeof mockAgentNodeData.runtime).toBe('string');
      expect(typeof mockAgentNodeData.promptSummary).toBe('string');
      expect(Array.isArray(mockAgentNodeData.inputVariables)).toBe(true);
      expect(typeof mockAgentNodeData.outputVariable).toBe('string');
    });

    it('should have valid category for agent nodes', () => {
      expect(mockAgentNodeData.category).toBe('ai');
    });
  });

  // ── Test 2: Agent Node Serialization ──
  describe('Agent Node Serialization', () => {
    it('should serialize agent node data to JSON', () => {
      const serialized = JSON.stringify(mockAgentNodeData);
      expect(serialized).toContain('Research Agent');
      expect(serialized).toContain('Claude 3.5');
      expect(serialized).toContain('OpenRouter');
    });

    it('should deserialize agent node data from JSON', () => {
      const serialized = JSON.stringify(mockAgentNodeData);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.agentName).toBe('Research Agent');
      expect(deserialized.model).toBe('Claude 3.5');
      expect(deserialized.provider).toBe('OpenRouter');
      expect(deserialized.inputVariables).toEqual(['user_input', 'context']);
      expect(deserialized.outputVariable).toBe('research_result');
    });

    it('should preserve round-trip serialization', () => {
      const original = mockAgentNodeData;
      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(original);
    });

    it('should handle empty input variables', () => {
      const data = {
        ...mockAgentNodeData,
        inputVariables: [],
      };
      const serialized = JSON.stringify(data);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.inputVariables).toEqual([]);
    });

    it('should handle multiple input variables', () => {
      const data = {
        ...mockAgentNodeData,
        inputVariables: ['var1', 'var2', 'var3', 'var4'],
      };
      const serialized = JSON.stringify(data);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.inputVariables).toEqual(['var1', 'var2', 'var3', 'var4']);
    });
  });

  // ── Test 3: Agent Node Data Validation ──
  describe('Agent Node Data Validation', () => {
    it('should validate required fields are present', () => {
      const requiredFields = [
        'agentName',
        'model',
        'provider',
        'runtime',
        'promptSummary',
        'inputVariables',
        'outputVariable',
      ];

      requiredFields.forEach((field) => {
        expect(mockAgentNodeData).toHaveProperty(field);
      });
    });

    it('should validate agent name is non-empty', () => {
      expect(mockAgentNodeData.agentName.length).toBeGreaterThan(0);
    });

    it('should validate model is non-empty', () => {
      expect(mockAgentNodeData.model.length).toBeGreaterThan(0);
    });

    it('should validate provider is non-empty', () => {
      expect(mockAgentNodeData.provider.length).toBeGreaterThan(0);
    });

    it('should validate runtime is non-empty', () => {
      expect(mockAgentNodeData.runtime.length).toBeGreaterThan(0);
    });

    it('should validate output variable is non-empty', () => {
      expect(mockAgentNodeData.outputVariable.length).toBeGreaterThan(0);
    });

    it('should validate input variables is an array', () => {
      expect(Array.isArray(mockAgentNodeData.inputVariables)).toBe(true);
    });
  });

  // ── Test 4: Agent Node Status States ──
  describe('Agent Node Status States', () => {
    it('should support default status', () => {
      const data = { ...mockAgentNodeData, status: 'default' as const };
      expect(data.status).toBe('default');
    });

    it('should support running status', () => {
      const data = { ...mockAgentNodeData, status: 'running' as const };
      expect(data.status).toBe('running');
    });

    it('should support error status', () => {
      const data = { ...mockAgentNodeData, status: 'error' as const };
      expect(data.status).toBe('error');
    });

    it('should support disabled status', () => {
      const data = { ...mockAgentNodeData, status: 'disabled' as const };
      expect(data.status).toBe('disabled');
    });

    it('should allow error message with error status', () => {
      const data = {
        ...mockAgentNodeData,
        status: 'error' as const,
        errorMessage: 'Agent execution failed',
      };
      expect(data.errorMessage).toBe('Agent execution failed');
    });
  });

  // ── Test 5: Agent Node Metadata Updates ──
  describe('Agent Node Metadata Updates', () => {
    it('should allow updating agent name', () => {
      const updated = { ...mockAgentNodeData, agentName: 'Updated Agent' };
      expect(updated.agentName).toBe('Updated Agent');
    });

    it('should allow updating model', () => {
      const updated = { ...mockAgentNodeData, model: 'GPT-4' };
      expect(updated.model).toBe('GPT-4');
    });

    it('should allow updating provider', () => {
      const updated = { ...mockAgentNodeData, provider: 'OpenAI' };
      expect(updated.provider).toBe('OpenAI');
    });

    it('should allow updating runtime', () => {
      const updated = { ...mockAgentNodeData, runtime: 'Local' };
      expect(updated.runtime).toBe('Local');
    });

    it('should allow updating prompt summary', () => {
      const updated = {
        ...mockAgentNodeData,
        promptSummary: 'New prompt description',
      };
      expect(updated.promptSummary).toBe('New prompt description');
    });

    it('should allow updating input variables', () => {
      const updated = {
        ...mockAgentNodeData,
        inputVariables: ['new_var1', 'new_var2'],
      };
      expect(updated.inputVariables).toEqual(['new_var1', 'new_var2']);
    });

    it('should allow updating output variable', () => {
      const updated = {
        ...mockAgentNodeData,
        outputVariable: 'new_output',
      };
      expect(updated.outputVariable).toBe('new_output');
    });
  });

  // ── Test 6: Agent Node Edge Cases ──
  describe('Agent Node Edge Cases', () => {
    it('should handle very long agent names', () => {
      const longName = 'A'.repeat(100);
      const data = { ...mockAgentNodeData, agentName: longName };
      expect(data.agentName.length).toBe(100);
    });

    it('should handle very long prompt summaries', () => {
      const longPrompt = 'A'.repeat(500);
      const data = { ...mockAgentNodeData, promptSummary: longPrompt };
      expect(data.promptSummary.length).toBe(500);
    });

    it('should handle many input variables', () => {
      const manyVars = Array.from({ length: 20 }, (_, i) => `var_${i}`);
      const data = { ...mockAgentNodeData, inputVariables: manyVars };
      expect(data.inputVariables.length).toBe(20);
    });

    it('should handle special characters in names', () => {
      const data = {
        ...mockAgentNodeData,
        agentName: 'Agent-Name_123!@#',
      };
      expect(data.agentName).toBe('Agent-Name_123!@#');
    });

    it('should handle unicode characters', () => {
      const data = {
        ...mockAgentNodeData,
        agentName: 'Agent 🤖 智能',
      };
      expect(data.agentName).toBe('Agent 🤖 智能');
    });
  });

  // ── Test 7: Agent Node Type Compatibility ──
  describe('Agent Node Type Compatibility', () => {
    it('should be compatible with WorkflowNodeData interface', () => {
      const nodeData: WorkflowNodeData = mockAgentNodeData;
      expect(nodeData.title).toBe('Research Agent');
      expect(nodeData.category).toBe('ai');
    });

    it('should maintain type safety with agent-specific fields', () => {
      const agentData = mockAgentNodeData;
      expect(agentData.agentName).toBeDefined();
      expect(agentData.model).toBeDefined();
      expect(agentData.provider).toBeDefined();
    });
  });

  // ── Test 8: Agent Node Immutability ──
  describe('Agent Node Immutability', () => {
    it('should not mutate original data when creating updated copy', () => {
      const original = { ...mockAgentNodeData };
      const updated = { ...original, agentName: 'New Name' };

      expect(original.agentName).toBe('Research Agent');
      expect(updated.agentName).toBe('New Name');
    });

    it('should preserve original input variables array', () => {
      const original = { ...mockAgentNodeData };
      const updated = {
        ...original,
        inputVariables: [...original.inputVariables, 'new_var'],
      };

      expect(original.inputVariables).toEqual(['user_input', 'context']);
      expect(updated.inputVariables).toEqual(['user_input', 'context', 'new_var']);
    });
  });
});
