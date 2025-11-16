import type {
  ISyntagmaAgentInstanceConfig,
  ISyntagmaOperatorBinding,
  ISyntagmaProjectChatIds,
  ISyntagmaProjectConfig,
  ISyntagmaSquadConfig,
  ISyntagmaSquadRoleConfig,
  ISyntagmaStageBinding} from './syntagma-project-config.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertIsProjectChats(value: unknown): asserts value is ISyntagmaProjectChatIds {
  if (!isRecord(value)) {
    throw new Error('chats must be an object');
  }
  if (!isNonEmptyString(value.general)) {
    throw new Error('chats.general must be a non-empty string');
  }
  if (!isNonEmptyString(value.mumble)) {
    throw new Error('chats.mumble must be a non-empty string');
  }
  if (!isNonEmptyString(value.operator)) {
    throw new Error('chats.operator must be a non-empty string');
  }
}

function assertIsStageBinding(value: unknown): asserts value is ISyntagmaStageBinding {
  if (!isRecord(value)) {
    throw new Error('stages must be an object');
  }
  if (!isNonEmptyString(value.defaultStageSchemaId)) {
    throw new Error('stages.defaultStageSchemaId must be a non-empty string');
  }
}

function assertIsAgentInstanceConfig(value: unknown): asserts value is ISyntagmaAgentInstanceConfig {
  if (!isRecord(value)) {
    throw new Error('agent must be an object');
  }
  if (!isNonEmptyString(value.agentId)) {
    throw new Error('agent.agentId must be a non-empty string');
  }
}

function assertIsSquadRoleConfig(value: unknown): asserts value is ISyntagmaSquadRoleConfig {
  if (!isRecord(value)) {
    throw new Error('squad role must be an object');
  }
  if (!isNonEmptyString(value.roleKey)) {
    throw new Error('squad roleKey must be a non-empty string');
  }
  if (Array.isArray(value.agents)) {
    for (const agent of value.agents) {
      assertIsAgentInstanceConfig(agent);
    }
  }
}

function assertIsSquadConfig(value: unknown): asserts value is ISyntagmaSquadConfig {
  if (!isRecord(value)) {
    throw new Error('squad must be an object');
  }
  if (!isNonEmptyString(value.squadKey)) {
    throw new Error('squad.squadKey must be a non-empty string');
  }
  if (!Array.isArray(value.roles) || value.roles.length === 0) {
    throw new Error('squad.roles must be a non-empty array');
  }

  for (const role of value.roles) {
    assertIsSquadRoleConfig(role);
  }
}

function assertIsOperatorBinding(value: unknown): asserts value is ISyntagmaOperatorBinding {
  if (!isRecord(value)) {
    throw new Error('operator must be an object');
  }
  if (!isNonEmptyString(value.operatorKey)) {
    throw new Error('operator.operatorKey must be a non-empty string');
  }
}

export function assertIsSyntagmaProjectConfig(value: unknown): asserts value is ISyntagmaProjectConfig {
  if (!isRecord(value)) {
    throw new Error('project config must be an object');
  }
  if (!isNonEmptyString(value.projectId)) {
    throw new Error('projectId must be a non-empty string');
  }
  if (!isNonEmptyString(value.name)) {
    throw new Error('name must be a non-empty string');
  }
  assertIsProjectChats(value.chats);

  if (!Array.isArray(value.squads) || value.squads.length === 0) {
    throw new Error('squads must be a non-empty array');
  }

  for (const squad of value.squads) {
    assertIsSquadConfig(squad);
  }
  assertIsStageBinding(value.stages);

  if (Array.isArray(value.operators)) {
    for (const operator of value.operators) {
      assertIsOperatorBinding(operator);
    }
  }
}
