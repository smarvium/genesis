// Canvas-specific types for @xyflow/react compatibility
import type { Node, Edge } from '@xyflow/react';

// Base node data interfaces that extend the required structure
export interface BaseNodeData {
  label: string;
  description: string;
  icon?: React.ComponentType<any>;
  color: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface AgentNodeData extends BaseNodeData {
  role: string;
  tools: string[];
  personality?: string;
  status: 'ready' | 'executing' | 'paused' | 'error' | 'completed';
  performance?: {
    averageResponseTime: number;
    successRate: number;
    lastExecution?: string;
  };
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType: 'manual' | 'schedule' | 'webhook' | 'event';
  config?: Record<string, any>;
  status: 'ready' | 'active' | 'triggered' | 'error';
  schedule?: {
    frequency?: string;
    nextRun?: string;
    timezone?: string;
  };
  webhook?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

export interface ActionNodeData extends BaseNodeData {
  actionType: 'api' | 'email' | 'database' | 'webhook' | 'notification';
  config?: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'error';
  validation?: {
    isValid: boolean;
    errors: string[];
  };
  metrics?: {
    executionCount: number;
    averageTime: number;
    lastRun?: string;
  };
}

export interface ConditionNodeData extends BaseNodeData {
  conditionType: 'if' | 'switch' | 'filter' | 'gate';
  condition: string;
  status: 'ready' | 'evaluating' | 'true' | 'false' | 'error';
}

export interface DelayNodeData extends BaseNodeData {
  delayType: 'fixed' | 'dynamic' | 'conditional';
  duration: string;
  status: 'ready' | 'waiting' | 'paused' | 'completed' | 'error';
}

// Typed node definitions for @xyflow/react
export type AgentNode = Node<AgentNodeData, 'agent'>;
export type TriggerNode = Node<TriggerNodeData, 'trigger'>;
export type ActionNode = Node<ActionNodeData, 'action'>;
export type ConditionNode = Node<ConditionNodeData, 'condition'>;
export type DelayNode = Node<DelayNodeData, 'delay'>;

export type CanvasNode = AgentNode | TriggerNode | ActionNode | ConditionNode | DelayNode;
export type CanvasEdge = Edge;