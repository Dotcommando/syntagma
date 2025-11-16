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

export enum SYNTAGMA_MEM_QUERY_SORT_FIELD {
  CREATED_AT = 'createdAt',
  IMPORTANCE = 'importance',
  SIMILARITY = 'similarity',
}

export enum SYNTAGMA_MEM_QUERY_SORT_ORDER {
  ASC = 'asc',
  DESC = 'desc',
}

export interface ISyntagmaMemQueryFilter {
  scopes?: SYNTAGMA_MEM_SCOPE[];
  projectId?: string;
  taskId?: string;
  ownerAgentId?: string;
  ownerRoleKey?: string;
  authorAgentId?: string;
  authorRoleKey?: string;
  audience?: SYNTAGMA_MEM_AUDIENCE;
  tagsIncludeAny?: string[];
  tagsIncludeAll?: string[];
  minImportance?: number;
  maxImportance?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface ISyntagmaMemQuerySort {
  field: SYNTAGMA_MEM_QUERY_SORT_FIELD;
  order: SYNTAGMA_MEM_QUERY_SORT_ORDER;
}

export interface ISyntagmaMemQueryVectorConfig {
  topK?: number;
  similarityThreshold?: number;
}

export interface ISyntagmaMemQuery {
  filter?: ISyntagmaMemQueryFilter;
  textSearch?: string;
  queryEmbedding?: ISyntagmaMemEmbedding;
  vectorConfig?: ISyntagmaMemQueryVectorConfig;
  limit?: number;
  offset?: number;
  sort?: ISyntagmaMemQuerySort[];
  includeEmbeddings?: boolean;
  includeExtra?: boolean;
}

export interface ISyntagmaMemQueryResultItem {
  entry: ISyntagmaMemEntry;
  similarityScore?: number;
}

export interface ISyntagmaMemQueryResult {
  total: number;
  limit: number;
  offset: number;
  items: ISyntagmaMemQueryResultItem[];
}
