export enum SYNTAGMA_MEM_SCOPE {
  PROJECT = 'project',
  TASK = 'task',
  PERSONAL = 'personal',
}

export enum SYNTAGMA_MEM_AUDIENCE {
  TECHNICAL = 'technical',
  NON_TECHNICAL = 'non_technical',
  MIXED = 'mixed',
  ANY = 'any',
}

export interface ISyntagmaMemEmbedding {
  providerKey: string;
  modelKey: string;
  vector: number[];
  dim: number;
}

export interface ISyntagmaMemEntry {
  scope: SYNTAGMA_MEM_SCOPE;
  projectId?: string;
  taskId?: string;
  ownerAgentId?: string;
  ownerRoleKey?: string;
  authorAgentId?: string;
  authorRoleKey?: string;
  audience?: SYNTAGMA_MEM_AUDIENCE;
  text: string;
  summary?: string;
  tags?: string[];
  importance?: number;
  embeddings?: ISyntagmaMemEmbedding[];
  createdAt: string;
  createdBy?: string;
  extra?: Record<string, unknown>;
}

export interface ISyntagmaMemBatchItem {
  scope: SYNTAGMA_MEM_SCOPE;
  projectId?: string;
  taskId?: string;
  ownerAgentId?: string;
  ownerRoleKey?: string;
  authorAgentId?: string;
  authorRoleKey?: string;
  audience?: SYNTAGMA_MEM_AUDIENCE;
  text: string;
  summary?: string;
  tags?: string[];
  importance?: number;
  embeddings?: ISyntagmaMemEmbedding[];
  extra?: Record<string, unknown>;
}

export type TSyntagmaMemBatch = ISyntagmaMemBatchItem[];

export interface ISyntagmaMemWriteResultItem {
  ok: boolean;
  errorMessage?: string;
  entryId?: string;
  originalIndex: number;
}

export interface ISyntagmaMemWriteResult {
  insertedCount: number;
  items: ISyntagmaMemWriteResultItem[];
}
