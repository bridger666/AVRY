export type WorkflowSource = 'n8n' | 'blueprint';
export type WorkflowStatus = 'active' | 'draft' | 'archived';

export interface ConsoleWorkflow {
  id: string;
  name: string;
  source: WorkflowSource;
  status: WorkflowStatus;
  createdAt?: string;
  updatedAt?: string;
  n8nId?: string;
  blueprintId?: string;
  description?: string;
}
