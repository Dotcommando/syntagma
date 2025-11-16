import type { INode } from '../types';

export enum SYNTAGMA_CHAT_KIND {
  PROJECT_GENERAL = 'project_general',
  PROJECT_MUMBLE = 'project_mumble',
  PROJECT_OPERATOR = 'project_operator',
  DIRECT = 'direct',
  GROUP = 'group',
  SYSTEM = 'system',
}

export enum SYNTAGMA_CHAT_PARTICIPANT_KIND {
  HUMAN = 'human',
  AGENT = 'agent',
  GROUP = 'group',
  SYSTEM = 'system',
}

export enum SYNTAGMA_CHAT_MESSAGE_ROLE {
  HUMAN = 'human',
  AGENT = 'agent',
  SYSTEM = 'system',
}

export enum SYNTAGMA_CHAT_MESSAGE_DIRECTION {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export enum SYNTAGMA_CHAT_MESSAGE_PART_KIND {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  HTML = 'html',
  ATTACHMENT = 'attachment',
}

export interface ISyntagmaChatMessagePartBase {
  kind: SYNTAGMA_CHAT_MESSAGE_PART_KIND;
}

export interface ISyntagmaChatMessagePartText
  extends ISyntagmaChatMessagePartBase {
  kind: SYNTAGMA_CHAT_MESSAGE_PART_KIND.TEXT;
  text: string;
}

export interface ISyntagmaChatMessagePartMarkdown
  extends ISyntagmaChatMessagePartBase {
  kind: SYNTAGMA_CHAT_MESSAGE_PART_KIND.MARKDOWN;
  text: string;
}

export interface ISyntagmaChatMessagePartHtml
  extends ISyntagmaChatMessagePartBase {
  kind: SYNTAGMA_CHAT_MESSAGE_PART_KIND.HTML;
  html: string;
}

export interface ISyntagmaChatMessagePartAttachment
  extends ISyntagmaChatMessagePartBase {
  kind: SYNTAGMA_CHAT_MESSAGE_PART_KIND.ATTACHMENT;
  mimeType?: string;
  fileId?: string;
  fileName?: string;
  url?: string;
  sizeBytes?: number;
}

export type ISyntagmaChatMessagePart = | ISyntagmaChatMessagePartText
  | ISyntagmaChatMessagePartMarkdown
  | ISyntagmaChatMessagePartHtml
  | ISyntagmaChatMessagePartAttachment;

export interface ISyntagmaChatMention {
  raw: string;
  callSign: string;
  offset: number;
  length: number;
}

export interface ISyntagmaChatTransportBinding {
  transportKey: string;
  chatExternalId: string;
  threadExternalId?: string;
  extra?: Record<string, unknown>;
}

export interface ISyntagmaChatMessageTransportBinding {
  transportKey: string;
  chatExternalId?: string;
  messageExternalId: string;
  extra?: Record<string, unknown>;
}

export interface ISyntagmaChatParticipant {
  participantId: string;
  kind: SYNTAGMA_CHAT_PARTICIPANT_KIND | string;
  displayName?: string;
  roleKey?: string;
  agentId?: string;
  operatorKey?: string;
  transportBindings?: ISyntagmaChatTransportBinding[];
}

export interface ISyntagmaChatParticipantRef {
  participantId: string;
  displayName?: string;
  kind?: SYNTAGMA_CHAT_PARTICIPANT_KIND | string;
}

export interface ISyntagmaChatAuthor {
  participantId?: string;
  displayName?: string;
  kind?: SYNTAGMA_CHAT_PARTICIPANT_KIND | string;
  roleKey?: string;
  agentId?: string;
  operatorKey?: string;
  transportKey?: string;
  transportUserId?: string;
  transportChatId?: string;
  transportUsername?: string;
}

export interface ISyntagmaChatMessageMeta {
  projectId?: string;
  chatKind?: SYNTAGMA_CHAT_KIND | string;
  direction?: SYNTAGMA_CHAT_MESSAGE_DIRECTION;
  role?: SYNTAGMA_CHAT_MESSAGE_ROLE;
  replyToMessageId?: string;
  correlationId?: string;
  mentions?: ISyntagmaChatMention[];
  transportBindings?: ISyntagmaChatMessageTransportBinding[];
  rawTransportPayload?: unknown;
  author?: ISyntagmaChatAuthor;
  createdAt?: string;
}

export interface ISyntagmaChatIncomingMessagePayload {
  text?: string;
  parts?: ISyntagmaChatMessagePart[];
}

export interface ISyntagmaChatIncomingMsg {
  projectId?: string;
  chatId?: string;
  chatKey?: string;
  chatKind?: SYNTAGMA_CHAT_KIND | string;
  chatMessage: ISyntagmaChatIncomingMessagePayload;
  meta?: ISyntagmaChatMessageMeta;
  payload?: unknown;
}

export interface ISyntagmaChatRecord {
  _id: string;
  projectId?: string;
  chatKey?: string;
  kind?: SYNTAGMA_CHAT_KIND | string;
  title?: string;
  participants?: ISyntagmaChatParticipant[];
  transportBindings?: ISyntagmaChatTransportBinding[];
  createdAt: string;
  updatedAt: string;
}

export interface ISyntagmaChatMessageRecord {
  _id: string;
  chatId: string;
  projectId?: string;
  author?: ISyntagmaChatParticipantRef;
  role?: SYNTAGMA_CHAT_MESSAGE_ROLE;
  direction?: SYNTAGMA_CHAT_MESSAGE_DIRECTION;
  text?: string;
  parts?: ISyntagmaChatMessagePart[];
  mentions?: ISyntagmaChatMention[];
  transportBindings?: ISyntagmaChatMessageTransportBinding[];
  createdAt: string;
}

export interface ISyntagmaChatAbstractNodeDef {
  id: string;
  type: string;
  name?: string;
  mongo?: string;
  defaultProjectId?: string;
  defaultChatKind?: SYNTAGMA_CHAT_KIND | string;
  defaultChatKey?: string;
}

export interface ISyntagmaChatAbstractNode extends INode {
  mongo?: string;
  mongoConfig?: unknown;
}
