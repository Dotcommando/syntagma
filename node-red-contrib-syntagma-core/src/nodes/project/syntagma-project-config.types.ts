import type { INode } from '../types';

export enum SYNTAGMA_PROJECT_TYPE {
  PRODUCT_DEV = 'product_dev',
  TREND_RESEARCH = 'trend_research',
  CONTENT_PRODUCTION = 'content_production',
}

export interface ISyntagmaProjectChatIds {
  general: string;
  mumble: string;
  operator: string;
  squads?: Record<string, string>;
}

export interface ISyntagmaOperatorBinding {
  operatorKey: string;
  displayName?: string;
  telegram?: {
    userId?: string;
    username?: string;
  };
}

export interface ISyntagmaAgentInstanceConfig {
  agentId: string;
  callSign?: string;
  label?: string;
  notes?: string;
}

export interface ISyntagmaSquadRoleConfig {
  roleKey: string;
  label?: string;
  description?: string;
  groupCallSign?: string;
  agents?: ISyntagmaAgentInstanceConfig[];
}

export interface ISyntagmaSquadConfig {
  squadKey: string;
  label?: string;
  description?: string;
  roles: ISyntagmaSquadRoleConfig[];
  stageSchemaId?: string;
  defaultChatId?: string;
}

export interface ISyntagmaStageBinding {
  defaultStageSchemaId: string;
  perSquad?: Record<string, string>;
}

export interface ISyntagmaProjectConfig {
  projectId: string;
  name: string;
  projectType?: SYNTAGMA_PROJECT_TYPE | string;
  chats: ISyntagmaProjectChatIds;
  squads: ISyntagmaSquadConfig[];
  stages: ISyntagmaStageBinding;
  operators?: ISyntagmaOperatorBinding[];
  meta?: Record<string, unknown>;
}

export interface ISyntagmaProjectConfigNodeDef {
  id: string;
  type: string;
  name?: string;
  projectId?: string;
  configJson?: string;
}

export interface ISyntagmaProjectConfigNode extends INode {
  projectId: string;
  config: ISyntagmaProjectConfig;
}
