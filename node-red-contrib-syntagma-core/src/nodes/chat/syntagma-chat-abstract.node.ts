import type {
  ISyntagmaMongoConfigNode,
  ISyntagmaMongoConfigNodeDef,
} from '../mongo/mongo-config.types';
import type { ISyntagmaRED } from '../mongo/mongo-connection.types';
import type { INode } from '../types';
import {
  type ISyntagmaChatIncomingMsg,
  type ISyntagmaChatMessageMeta,
  type ISyntagmaChatMessagePart,
  type ISyntagmaChatMessagePartText,
  type ISyntagmaChatMessageTransportBinding,
  SYNTAGMA_CHAT_MESSAGE_DIRECTION,
  SYNTAGMA_CHAT_MESSAGE_PART_KIND,
  SYNTAGMA_CHAT_MESSAGE_ROLE,
} from './syntagma-chat-abstract.types';

interface ISyntagmaChatAbstractNodeDef extends ISyntagmaMongoConfigNodeDef {
  mongo?: string;
  defaultProjectId?: string;
  defaultChatKind?: string;
  defaultChatKey?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSyntagmaMongoConfigNode(
  value: unknown
): value is ISyntagmaMongoConfigNode {
  if (!isRecord(value)) {
    return false;
  }

  const maybeManager = value.connectionManager;

  if (!isRecord(maybeManager)) {
    return false;
  }

  const getDb = maybeManager.getDb;

  return typeof getDb === 'function';
}

function isIncomingChatMsg(value: unknown): value is ISyntagmaChatIncomingMsg {
  if (!isRecord(value)) {
    return false;
  }

  const chatMessage = value.chatMessage;

  if (!isRecord(chatMessage)) {
    return false;
  }

  const rawText = chatMessage.text;
  const rawParts = chatMessage.parts;
  const hasText = typeof rawText === 'string' && rawText.trim().length > 0;
  const hasParts = Array.isArray(rawParts);

  return hasText || hasParts;
}

function isTextPart(
  part: ISyntagmaChatMessagePart
): part is ISyntagmaChatMessagePartText {
  return part.kind === SYNTAGMA_CHAT_MESSAGE_PART_KIND.TEXT;
}

function normalizeTextFromParts(
  parts: ISyntagmaChatMessagePart[]
): string | undefined {
  const texts: string[] = [];

  for (const part of parts) {
    if (!isTextPart(part)) {
      continue;
    }

    const text = part.text;

    if (typeof text === 'string' && text.trim().length > 0) {
      texts.push(text.trim());
    }
  }

  if (texts.length === 0) {
    return undefined;
  }

  return texts.join('\n');
}

function buildSafeMeta(value: unknown): ISyntagmaChatMessageMeta | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const meta: ISyntagmaChatMessageMeta = {};

  if (
    typeof value.projectId === 'string'
    && value.projectId.trim().length > 0
  ) {
    meta.projectId = value.projectId.trim();
  }
  if (typeof value.chatKind === 'string' && value.chatKind.trim().length > 0) {
    meta.chatKind = value.chatKind.trim();
  }
  if (typeof value.direction === 'string') {
    if (value.direction === SYNTAGMA_CHAT_MESSAGE_DIRECTION.INCOMING) {
      meta.direction = SYNTAGMA_CHAT_MESSAGE_DIRECTION.INCOMING;
    } else if (value.direction === SYNTAGMA_CHAT_MESSAGE_DIRECTION.OUTGOING) {
      meta.direction = SYNTAGMA_CHAT_MESSAGE_DIRECTION.OUTGOING;
    }
  }
  if (typeof value.role === 'string') {
    if (value.role === SYNTAGMA_CHAT_MESSAGE_ROLE.HUMAN) {
      meta.role = SYNTAGMA_CHAT_MESSAGE_ROLE.HUMAN;
    } else if (value.role === SYNTAGMA_CHAT_MESSAGE_ROLE.AGENT) {
      meta.role = SYNTAGMA_CHAT_MESSAGE_ROLE.AGENT;
    } else if (value.role === SYNTAGMA_CHAT_MESSAGE_ROLE.SYSTEM) {
      meta.role = SYNTAGMA_CHAT_MESSAGE_ROLE.SYSTEM;
    }
  }
  if (
    typeof value.replyToMessageId === 'string'
    && value.replyToMessageId.trim().length > 0
  ) {
    meta.replyToMessageId = value.replyToMessageId.trim();
  }
  if (
    typeof value.correlationId === 'string'
    && value.correlationId.trim().length > 0
  ) {
    meta.correlationId = value.correlationId.trim();
  }
  if (Array.isArray(value.transportBindings)) {
    const bindings: ISyntagmaChatMessageTransportBinding[] = [];

    for (const item of value.transportBindings) {
      if (!isRecord(item)) {
        continue;
      }

      const transportKey = typeof item.transportKey === 'string' ? item.transportKey.trim() : '';
      const messageExternalId = typeof item.messageExternalId === 'string'
        ? item.messageExternalId.trim()
        : '';

      if (transportKey.length === 0 || messageExternalId.length === 0) {
        continue;
      }

      const binding: ISyntagmaChatMessageTransportBinding = {
        transportKey,
        messageExternalId,
      };

      if (
        typeof item.chatExternalId === 'string'
        && item.chatExternalId.trim().length > 0
      ) {
        binding.chatExternalId = item.chatExternalId.trim();
      }

      bindings.push(binding);
    }

    if (bindings.length > 0) {
      meta.transportBindings = bindings;
    }
  }
  if (typeof value.rawTransportPayload !== 'undefined') {
    meta.rawTransportPayload = value.rawTransportPayload;
  }
  if (
    typeof value.createdAt === 'string'
    && value.createdAt.trim().length > 0
  ) {
    meta.createdAt = value.createdAt.trim();
  }
  if (isRecord(value.author)) {
    const rawAuthor = value.author;
    const author: ISyntagmaChatMessageMeta['author'] = {};

    if (
      typeof rawAuthor.participantId === 'string'
      && rawAuthor.participantId.trim().length > 0
    ) {
      author.participantId = rawAuthor.participantId.trim();
    }
    if (
      typeof rawAuthor.displayName === 'string'
      && rawAuthor.displayName.trim().length > 0
    ) {
      author.displayName = rawAuthor.displayName.trim();
    }
    if (
      typeof rawAuthor.kind === 'string'
      && rawAuthor.kind.trim().length > 0
    ) {
      author.kind = rawAuthor.kind;
    }
    if (
      typeof rawAuthor.roleKey === 'string'
      && rawAuthor.roleKey.trim().length > 0
    ) {
      author.roleKey = rawAuthor.roleKey.trim();
    }
    if (
      typeof rawAuthor.agentId === 'string'
      && rawAuthor.agentId.trim().length > 0
    ) {
      author.agentId = rawAuthor.agentId.trim();
    }
    if (
      typeof rawAuthor.operatorKey === 'string'
      && rawAuthor.operatorKey.trim().length > 0
    ) {
      author.operatorKey = rawAuthor.operatorKey.trim();
    }
    if (
      typeof rawAuthor.transportKey === 'string'
      && rawAuthor.transportKey.trim().length > 0
    ) {
      author.transportKey = rawAuthor.transportKey.trim();
    }
    if (
      typeof rawAuthor.transportUserId === 'string'
      && rawAuthor.transportUserId.trim().length > 0
    ) {
      author.transportUserId = rawAuthor.transportUserId.trim();
    }
    if (
      typeof rawAuthor.transportChatId === 'string'
      && rawAuthor.transportChatId.trim().length > 0
    ) {
      author.transportChatId = rawAuthor.transportChatId.trim();
    }
    if (
      typeof rawAuthor.transportUsername === 'string'
      && rawAuthor.transportUsername.trim().length > 0
    ) {
      author.transportUsername = rawAuthor.transportUsername.trim();
    }
    if (Object.keys(author).length > 0) {
      meta.author = author;
    }
  }
  if (Object.keys(meta).length === 0) {
    return undefined;
  }

  return meta;
}

function syntagmaChatAbstractNode(RED: ISyntagmaRED): void {
  function ChatAbstractNode(
    this: INode,
    config: ISyntagmaChatAbstractNodeDef
  ): void {
    RED.nodes.createNode(this, config);

    this.mongo = config.mongo;

    const defaultProjectId = typeof config.defaultProjectId === 'string'
      ? config.defaultProjectId.trim()
      : '';
    const defaultChatKind = typeof config.defaultChatKind === 'string'
      ? config.defaultChatKind.trim()
      : '';
    const defaultChatKey = typeof config.defaultChatKey === 'string'
      ? config.defaultChatKey.trim()
      : '';
    const rawConfigNode = typeof config.mongo === 'string'
      ? RED.nodes.getNode(config.mongo)
      : undefined;

    if (!isSyntagmaMongoConfigNode(rawConfigNode)) {
      this.status({ fill: 'red', shape: 'ring', text: 'no mongo config' });
      this.error('Mongo config node is not set or invalid');

      return;
    }

    this.mongoConfig = rawConfigNode;
    this.status({ fill: 'grey', shape: 'ring', text: 'ready' });

    this.on('input', (...args: unknown[]) => {
      const msg = args[0];
      const maybeSend = args[1];
      const maybeDone = args[2];
      const send = typeof maybeSend === 'function'
        ? maybeSend
        : (innerMsg: unknown): void => {
          this.send(innerMsg);
        };
      const done = typeof maybeDone === 'function' ? maybeDone : undefined;

      if (!isIncomingChatMsg(msg)) {
        this.error('Incoming msg is not a valid chat message');

        if (done) {
          done();
        }

        return;
      }

      const configNodeUnknown = this.mongoConfig;

      if (!isSyntagmaMongoConfigNode(configNodeUnknown)) {
        this.status({ fill: 'red', shape: 'ring', text: 'no mongo config' });
        msg.payload = {
          ok: false,
          error: 'Mongo config node is not available',
        };
        send(msg);

        if (done) {
          done();
        }

        return;
      }

      const configNode = configNodeUnknown;
      const effectiveConfig = configNode.effectiveConfig;
      const connectionManager = configNode.connectionManager;
      const incoming: ISyntagmaChatIncomingMsg = msg;
      const nowIso = new Date().toISOString();
      const projectIdFromMsg = typeof incoming.projectId === 'string'
        ? incoming.projectId.trim()
        : '';
      const projectId = projectIdFromMsg.length > 0 ? projectIdFromMsg : defaultProjectId;

      if (projectId.length === 0) {
        this.status({ fill: 'red', shape: 'ring', text: 'no project id' });
        this.error('ProjectId is not set on msg or node config');

        msg.payload = {
          ok: false,
          error: 'projectId is required for syntagma-chat-abstract',
        };
        send(msg);

        if (done) {
          done();
        }

        return;
      }

      const chatKindFromMsg = typeof incoming.chatKind === 'string'
        ? incoming.chatKind.trim()
        : '';
      const chatKind = chatKindFromMsg.length > 0 ? chatKindFromMsg : defaultChatKind;
      const chatKeyFromMsg = typeof incoming.chatKey === 'string'
        ? incoming.chatKey.trim()
        : '';
      const chatKey = chatKeyFromMsg.length > 0 ? chatKeyFromMsg : defaultChatKey;
      const chatIdFromMsg = typeof incoming.chatId === 'string'
        ? incoming.chatId.trim()
        : '';
      const chatMessage = incoming.chatMessage;
      const meta = buildSafeMeta(incoming.meta);
      let text = typeof chatMessage.text === 'string' ? chatMessage.text : '';
      let parts = chatMessage.parts;

      if ((!parts || parts.length === 0) && text.trim().length === 0) {
        this.error('Incoming chatMessage has no text and no parts');

        if (done) {
          done();
        }

        return;
      }
      if (!parts && text.trim().length > 0) {
        parts = [];
      }
      if (!text && parts && parts.length > 0) {
        const normalized = normalizeTextFromParts(parts);

        if (normalized) {
          text = normalized;
        }
      }

      this.status({ fill: 'yellow', shape: 'ring', text: 'saving...' });

      connectionManager
        .getDb()
        .then((db) => {
          const chatsCollection = db.collection('syntagma_chats');
          const messagesCollection = db.collection('syntagma_chat_messages');
          const findOrCreateChat = (): Promise<string> => {
            if (chatIdFromMsg.length > 0) {
              return Promise.resolve(chatIdFromMsg);
            }
            if (chatKey.length === 0) {
              const doc = {
                projectId,
                kind: chatKind,
                createdAt: nowIso,
                updatedAt: nowIso,
              };

              return chatsCollection
                .insertOne(doc)
                .then((result) => String(result.insertedId));
            }

            return chatsCollection
              .findOne({
                projectId,
                chatKey,
              })
              .then((existingChat) => {
                if (existingChat && isRecord(existingChat)) {
                  const existingId = existingChat._id;

                  return String(existingId);
                }

                const newChatDoc = {
                  projectId,
                  chatKey,
                  kind: chatKind,
                  createdAt: nowIso,
                  updatedAt: nowIso,
                };

                return chatsCollection
                  .insertOne(newChatDoc)
                  .then((result) => String(result.insertedId));
              });
          };

          return findOrCreateChat().then((chatId) => {
            const messageDoc: Record<string, unknown> = {
              chatId,
              projectId,
              createdAt: nowIso,
            };

            if (text.trim().length > 0) {
              messageDoc.text = text;
            }
            if (parts && parts.length > 0) {
              messageDoc.parts = parts;
            }
            if (meta) {
              if (meta.role) {
                messageDoc.role = meta.role;
              }
              if (meta.direction) {
                messageDoc.direction = meta.direction;
              }
              if (meta.mentions) {
                messageDoc.mentions = meta.mentions;
              }
              if (meta.transportBindings) {
                messageDoc.transportBindings = meta.transportBindings;
              }
              if (meta.author) {
                const authorRef: Record<string, unknown> = {};

                if (meta.author.participantId) {
                  authorRef.participantId = meta.author.participantId;
                }
                if (meta.author.displayName) {
                  authorRef.displayName = meta.author.displayName;
                }
                if (meta.author.kind) {
                  authorRef.kind = meta.author.kind;
                }

                messageDoc.author = authorRef;
              }
            }

            return messagesCollection.insertOne(messageDoc).then((result) => {
              const messageId = String(result.insertedId);

              incoming.chatId = chatId;

              this.status({ fill: 'green', shape: 'dot', text: 'saved' });

              msg.payload = {
                ok: true,
                chatId,
                messageId,
                projectId,
                config: {
                  url: effectiveConfig.url,
                  dbName: effectiveConfig.dbName,
                  source: effectiveConfig.source,
                  envVarName: effectiveConfig.envVarName,
                  rawFromEnv: effectiveConfig.rawFromEnv,
                  rawFromNode: effectiveConfig.rawFromNode,
                },
                at: nowIso,
              };

              send(msg);

              if (done) {
                done();
              }
            });
          });
        })
        .catch((error) => {
          let message = 'Failed to save chat message';

          if (error instanceof Error) {
            message = error.message;
          }

          this.status({ fill: 'red', shape: 'dot', text: 'save failed' });
          this.error(message);

          msg.payload = {
            ok: false,
            error: message,
          };

          send(msg);

          if (done) {
            done();
          }
        });
    });
  }

  RED.nodes.registerType<ISyntagmaChatAbstractNodeDef>('syntagma-chat-abstract', ChatAbstractNode);
}

export = syntagmaChatAbstractNode;
