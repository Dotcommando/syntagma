import type { INode, IRED } from '../types';
import {
  ISyntagmaMemBatchItem,
  ISyntagmaMemEntry,
  ISyntagmaMemWriteResult,
  ISyntagmaMemWriteResultItem,
  SYNTAGMA_MEM_SCOPE,
  TSyntagmaMemBatch,
} from './mem-types';

interface IMongoInsertManyResult {
  insertedCount: number;
  insertedIds: Record<string, unknown>;
}

interface IMongoCollection<T> {
  insertMany(docs: T[]): Promise<IMongoInsertManyResult>;
}

interface IMongoDatabase {
  collection<T>(name: string): IMongoCollection<T>;
}

interface IMongoConfigNode {
  getDb(): Promise<IMongoDatabase>;
}

interface ISyntagmaMemWriteInMsg {
  memBatch?: TSyntagmaMemBatch;
  projectId?: string;
  taskId?: string;
  agentId?: string;
  roleKey?: string;
  meta?: {
    createdBy?: string;
  };
  [k: string]: unknown;
}

interface ISyntAGMA_MEM_WRITE_OUT_MSG extends ISyntagmaMemWriteInMsg {
  memWriteResult?: ISyntagmaMemWriteResult;
}

interface ISyntagmaMemWriteNodeConfig {
  name?: string;
  mongoConfigNodeId: string;
  embeddingsEnabled?: boolean;
  defaultEmbeddingProviderKey?: string;
  defaultEmbeddingModelKey?: string;
  writeMode?: 'insert' | 'upsert';
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertIsMemWriteNodeConfig(value: unknown): asserts value is ISyntagmaMemWriteNodeConfig {
  if (!isNonNullObject(value)) {
    throw new Error('Invalid config for syntagma-mem-write: expected object');
  }
  if (!('mongoConfigNodeId' in value)) {
    throw new Error('Invalid config for syntagma-mem-write: mongoConfigNodeId is required');
  }

  const id = Reflect.get(value, 'mongoConfigNodeId');

  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid config for syntagma-mem-write: mongoConfigNodeId must be non-empty string');
  }
}

function normalizeScope(
  item: ISyntagmaMemBatchItem,
  msg: ISyntagmaMemWriteInMsg
): ISyntagmaMemEntry | { errorMessage: string } {
  const scope = item.scope;
  const projectId = item.projectId ?? msg.projectId;
  const taskId = item.taskId ?? msg.taskId;
  const ownerAgentId = item.ownerAgentId ?? msg.agentId;
  const ownerRoleKey = item.ownerRoleKey ?? msg.roleKey;
  const authorAgentId = item.authorAgentId ?? msg.agentId;
  const authorRoleKey = item.authorRoleKey ?? msg.roleKey;

  if (scope === SYNTAGMA_MEM_SCOPE.PERSONAL) {
    if (!ownerAgentId && !ownerRoleKey) {
      return { errorMessage: 'personal scope requires ownerAgentId or ownerRoleKey' };
    }
  }
  if (scope === SYNTAGMA_MEM_SCOPE.PROJECT) {
    if (!projectId) {
      return { errorMessage: 'project scope requires projectId' };
    }
  }
  if (scope === SYNTAGMA_MEM_SCOPE.TASK) {
    if (!projectId || !taskId) {
      return { errorMessage: 'task scope requires projectId and taskId' };
    }
  }
  if (!item.text) {
    return { errorMessage: 'mem entry text is empty' };
  }

  const createdAt = new Date().toISOString();
  let createdBy: string | undefined;

  if (msg.meta && typeof msg.meta === 'object' && 'createdBy' in msg.meta) {
    const rawCreatedBy = Reflect.get(msg.meta, 'createdBy');

    if (typeof rawCreatedBy === 'string') {
      createdBy = rawCreatedBy;
    }
  }

  const entry: ISyntagmaMemEntry = {
    scope,
    projectId,
    taskId,
    ownerAgentId,
    ownerRoleKey,
    authorAgentId,
    authorRoleKey,
    audience: item.audience,
    text: item.text,
    summary: item.summary,
    tags: item.tags,
    importance: item.importance,
    embeddings: item.embeddings,
    createdAt,
    createdBy,
    extra: item.extra,
  };

  return entry;
}

async function handleInput(
  node: INode,
  config: ISyntagmaMemWriteNodeConfig,
  msg: ISyntAGMA_MEM_WRITE_OUT_MSG,
  mongoConfigNode: IMongoConfigNode,
  send: (msg: ISyntAGMA_MEM_WRITE_OUT_MSG) => void,
  done: (err?: unknown) => void
): Promise<void> {
  const batch = msg.memBatch;

  if (!batch || !Array.isArray(batch) || batch.length === 0) {
    msg.memWriteResult = {
      insertedCount: 0,
      items: [],
    };

    send(msg);
    done();

    return;
  }

  const entries: ISyntagmaMemEntry[] = [];
  const resultItems: ISyntagmaMemWriteResultItem[] = [];
  const insertIndexByBatchIndex: number[] = [];
  let idx = 0;

  while (idx < batch.length) {
    const normalized = normalizeScope(batch[idx], msg);

    if ('errorMessage' in normalized) {
      resultItems.push({
        ok: false,
        originalIndex: idx,
        errorMessage: normalized.errorMessage,
      });
      insertIndexByBatchIndex.push(-1);
    } else {
      entries.push(normalized);
      insertIndexByBatchIndex.push(entries.length - 1);
      resultItems.push({
        ok: true,
        originalIndex: idx,
      });
    }

    idx += 1;
  }

  if (entries.length === 0) {
    msg.memWriteResult = {
      insertedCount: 0,
      items: resultItems,
    };

    send(msg);
    done();

    return;
  }

  try {
    const db = await mongoConfigNode.getDb();
    const collection = db.collection<ISyntagmaMemEntry>('syntagma_mem_entries');
    const insertResult = await collection.insertMany(entries);
    const entryIdsByInsertIndex: string[] = [];
    const insertedKeys = Object.keys(insertResult.insertedIds);
    let k = 0;

    while (k < insertedKeys.length) {
      const key = insertedKeys[k];
      const rawId = insertResult.insertedIds[key];
      const insertIndex = Number(key);

      if (!Number.isNaN(insertIndex)) {
        entryIdsByInsertIndex[insertIndex] = String(rawId);
      }

      k += 1;
    }

    let resultItemIndex = 0;

    while (resultItemIndex < resultItems.length) {
      const resultItem = resultItems[resultItemIndex];

      if (resultItem.ok) {
        const insIdx = insertIndexByBatchIndex[resultItemIndex];

        if (insIdx >= 0 && insIdx < entryIdsByInsertIndex.length) {
          resultItem.entryId = entryIdsByInsertIndex[insIdx];
        }
      }

      resultItemIndex += 1;
    }

    msg.memWriteResult = {
      insertedCount: insertResult.insertedCount,
      items: resultItems,
    };

    send(msg);
    done();
  } catch (error) {
    let i = 0;

    while (i < resultItems.length) {
      const resultItem = resultItems[i];

      if (resultItem.ok) {
        resultItem.ok = false;
        resultItem.errorMessage = String(error);
      }

      i += 1;
    }

    msg.memWriteResult = {
      insertedCount: 0,
      items: resultItems,
    };

    node.error(String(error));
    send(msg);
    done(error);
  }
}

function registerNode(RED: IRED): void {
  function isMongoConfigNode(value: unknown): value is IMongoConfigNode {
    if (typeof value !== 'object' || value === null) return false;

    const getDb = Reflect.get(value, 'getDb');

    return typeof getDb === 'function';
  }

  function isMemWriteOutMsg(value: unknown): value is ISyntAGMA_MEM_WRITE_OUT_MSG {
    if (typeof value !== 'object' || value === null) return false;
    if ('memBatch' in value) return true;
    if ('memWriteResult' in value) return true;
    if ('projectId' in value) return true;
    if ('taskId' in value) return true;

    return false;
  }

  function SyntagmaMemWriteNode(this: INode, config: unknown): void {
    assertIsMemWriteNodeConfig(config);

    RED.nodes.createNode(this, config);

    const maybeMongoNode = RED.nodes.getNode(config.mongoConfigNodeId);
    const mongoConfigNode = isMongoConfigNode(maybeMongoNode) ? maybeMongoNode : null;

    this.on('input', (...args: unknown[]): void => {
      if (args.length < 3) return;

      const maybeMsg = args[0];
      const maybeSend = args[1];
      const maybeDone = args[2];

      if (!isMemWriteOutMsg(maybeMsg)) {
        if (typeof maybeDone === 'function') {
          maybeDone();
        }

        return;
      }
      if (typeof maybeSend !== 'function' || typeof maybeDone !== 'function') {
        if (typeof maybeDone === 'function') {
          maybeDone();
        }

        return;
      }

      const msg = maybeMsg;
      const send = (m: ISyntAGMA_MEM_WRITE_OUT_MSG): void => {
        maybeSend(m);
      };
      const done = (err?: unknown): void => {
        maybeDone(err);
      };

      if (!mongoConfigNode) {
        const errorMessage = 'Mongo config node not found for syntagma-mem-write';

        this.error(errorMessage);

        msg.memWriteResult = {
          insertedCount: 0,
          items: [],
        };

        send(msg);
        done(new Error(errorMessage));

        return;
      }

      void handleInput(this, config, msg, mongoConfigNode, send, done);
    });
  }

  RED.nodes.registerType('syntagma-mem-write', SyntagmaMemWriteNode);
}

export = registerNode;
