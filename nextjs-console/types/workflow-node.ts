export type WorkflowNodeCategory =
  | 'trigger'
  | 'action'
  | 'ai'
  | 'condition'
  | 'channel'
  | 'system';

export type WorkflowNodeVisualVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'neutral';

export type WorkflowNodeData = {
  title: string;
  subtitle?: string;
  description?: string;
  category: WorkflowNodeCategory;
  variant?: WorkflowNodeVisualVariant;
  icon?: string;
  // Optional labels for connections, mainly for conditions
  outputs?: { id: string; label: string }[];
  // Raw n8n node object for deep debugging / mapping if needed
  rawN8n?: any;
};
