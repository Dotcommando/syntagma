import type { ISyntagmaMongoConfigNode } from '../mongo/mongo-config.types';
import type { ISyntagmaRED } from '../mongo/mongo-connection.types';
import type { INode } from '../types';
import {
  ISyntagmaMemEmbedding,
  ISyntagmaMemEntry,
  ISyntagmaMemQuery,
  ISyntagmaMemQueryFilter,
  ISyntagmaMemQueryResult,
  ISyntagmaMemQueryResultItem,
  ISyntagmaMemQuerySort,
  ISyntagmaMemQueryVectorConfig,
  SYNTAGMA_MEM_QUERY_SORT_FIELD,
  SYNTAGMA_MEM_QUERY_SORT_ORDER,
  SYNTAGMA_MEM_SCOPE,
} from './mem-types';

interface IMongoFilter {
  [key: string]: unknown;
}

interface ISyntagmaMemQueryNodeConfig {
  name?: string;
  mongoConfig: string;
  collectionName: string;
  defaultScopes?: SYNTAGMA_MEM_SCOPE[];
  defaultLimit?: number;
  maxLimit?: number;
  enableVectorSearch?: boolean;
  defaultTopK?: number;
  defaultSimilarityThreshold?: number;
  defaultSortField?: SYNTAGMA_MEM_QUERY_SORT_FIELD;
  defaultSortOrder?: SYNTAGMA_MEM_QUERY_SORT_ORDER;
}

interface ISyntagmaMemQueryInMsg {
  memQuery?: ISyntagmaMemQuery;
  projectId?: string;
  taskId?: string;
  agentId?: string;
  roleKey?: string;
  meta?: {
    requestedBy?: string;
  };
  [key: string]: unknown;
}

interface ISyntagmaMemQueryOutMsg extends ISyntagmaMemQueryInMsg {
  memQueryResult?: ISyntagmaMemQueryResult;
  errorMessage?: string;
}

interface INumberRangeFilter {
  $gte?: number;
  $lte?: number;
}

interface IStringRangeFilter {
  $gte?: string;
  $lte?: string;
}

interface ITextFilter {
  $search: string;
}

interface ITagsFilter {
  $in?: string[];
  $all?: string[];
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertIsMemQueryNodeConfig(value: unknown): asserts value is ISyntagmaMemQueryNodeConfig {
  if (!isNonNullObject(value)) {
    throw new Error('Invalid config for syntagma-mem-query: expected object');
  }
  if (!('mongoConfig' in value)) {
    throw new Error('Invalid config for syntagma-mem-query: mongoConfig is required');
  }
  if (!('collectionName' in value)) {
    throw new Error('Invalid config for syntagma-mem-query: collectionName is required');
  }

  const mongoConfig = Reflect.get(value, 'mongoConfig');
  const collectionName = Reflect.get(value, 'collectionName');

  if (typeof mongoConfig !== 'string' || mongoConfig.length === 0) {
    throw new Error('Invalid config for syntagma-mem-query: mongoConfig must be non-empty string');
  }
  if (typeof collectionName !== 'string' || collectionName.length === 0) {
    throw new Error('Invalid config for syntagma-mem-query: collectionName must be non-empty string');
  }
}

function isMongoConfigNode(value: unknown): value is ISyntagmaMongoConfigNode {
  if (!isNonNullObject(value)) {
    return false;
  }

  const maybeConnectionManager = Reflect.get(value, 'connectionManager');

  if (!isNonNullObject(maybeConnectionManager)) {
    return false;
  }

  const getDb = Reflect.get(maybeConnectionManager, 'getDb');

  return typeof getDb === 'function';
}

function isMemQueryMsg(value: unknown): value is ISyntagmaMemQueryOutMsg {
  if (!isNonNullObject(value)) {
    return false;
  }
  if ('memQuery' in value) return true;
  if ('memQueryResult' in value) return true;
  if ('projectId' in value) return true;
  if ('taskId' in value) return true;

  return false;
}

function getEffectiveScopes(config: ISyntagmaMemQueryNodeConfig, filter: ISyntagmaMemQueryFilter | undefined): SYNTAGMA_MEM_SCOPE[] {
  if (filter?.scopes && filter.scopes.length > 0) {
    return filter.scopes;
  }
  if (config.defaultScopes && config.defaultScopes.length > 0) {
    return config.defaultScopes;
  }

  return [SYNTAGMA_MEM_SCOPE.TASK];
}

function normalizeLimit(config: ISyntagmaMemQueryNodeConfig, query: ISyntagmaMemQuery | undefined): number {
  const maxLimit = typeof config.maxLimit === 'number' && config.maxLimit > 0 ? config.maxLimit : 100;
  const defaultLimit = typeof config.defaultLimit === 'number' && config.defaultLimit > 0 ? config.defaultLimit : 20;
  const requestedLimit = query && typeof query.limit === 'number' ? query.limit : defaultLimit;

  if (requestedLimit <= 0) {
    return defaultLimit;
  }
  if (requestedLimit > maxLimit) {
    return maxLimit;
  }

  return requestedLimit;
}

function normalizeOffset(query: ISyntagmaMemQuery | undefined): number {
  if (!query || typeof query.offset !== 'number' || query.offset < 0) {
    return 0;
  }

  return query.offset;
}

function normalizeVectorConfig(config: ISyntagmaMemQueryNodeConfig, query: ISyntagmaMemQuery | undefined): ISyntagmaMemQueryVectorConfig {
  const topK = query?.vectorConfig && typeof query.vectorConfig.topK === 'number'
    ? query.vectorConfig.topK
    : config.defaultTopK;
  const threshold = query?.vectorConfig && typeof query.vectorConfig.similarityThreshold === 'number'
    ? query.vectorConfig.similarityThreshold
    : config.defaultSimilarityThreshold;
  const result: ISyntagmaMemQueryVectorConfig = {
    ...(typeof topK === 'number' && topK > 0 && { topK }),
    ...(typeof threshold === 'number' && { similarityThreshold: threshold }),
  };

  return result;
}

function normalizeSort(
  config: ISyntagmaMemQueryNodeConfig,
  query: ISyntagmaMemQuery | undefined,
  hasSimilarity: boolean
): ISyntagmaMemQuerySort[] {
  if (query?.sort && query.sort.length > 0) {
    return query.sort;
  }
  if (config.defaultSortField && config.defaultSortOrder) {
    return [
      {
        field: config.defaultSortField,
        order: config.defaultSortOrder,
      },
    ];
  }
  if (hasSimilarity) {
    return [
      {
        field: SYNTAGMA_MEM_QUERY_SORT_FIELD.SIMILARITY,
        order: SYNTAGMA_MEM_QUERY_SORT_ORDER.DESC,
      },
    ];
  }

  return [
    {
      field: SYNTAGMA_MEM_QUERY_SORT_FIELD.CREATED_AT,
      order: SYNTAGMA_MEM_QUERY_SORT_ORDER.DESC,
    },
  ];
}

function buildEffectiveFilter(
  baseFilter: ISyntagmaMemQueryFilter | undefined,
  projectIdFromMsg: string | undefined,
  taskIdFromMsg: string | undefined,
  agentIdFromMsg: string | undefined,
  roleKeyFromMsg: string | undefined
): ISyntagmaMemQueryFilter {
  let effectiveFilter: ISyntagmaMemQueryFilter = {};

  if (baseFilter) {
    effectiveFilter = {
      ...(baseFilter.projectId && { projectId: baseFilter.projectId }),
      ...(baseFilter.taskId && { taskId: baseFilter.taskId }),
      ...(baseFilter.ownerAgentId && { ownerAgentId: baseFilter.ownerAgentId }),
      ...(baseFilter.ownerRoleKey && { ownerRoleKey: baseFilter.ownerRoleKey }),
      ...(baseFilter.authorAgentId && { authorAgentId: baseFilter.authorAgentId }),
      ...(baseFilter.authorRoleKey && { authorRoleKey: baseFilter.authorRoleKey }),
      ...(baseFilter.audience && { audience: baseFilter.audience }),
      ...(Array.isArray(baseFilter.tagsIncludeAny)
        && baseFilter.tagsIncludeAny.length > 0 && { tagsIncludeAny: baseFilter.tagsIncludeAny }),
      ...(Array.isArray(baseFilter.tagsIncludeAll)
        && baseFilter.tagsIncludeAll.length > 0 && { tagsIncludeAll: baseFilter.tagsIncludeAll }),
      ...(typeof baseFilter.minImportance === 'number' && { minImportance: baseFilter.minImportance }),
      ...(typeof baseFilter.maxImportance === 'number' && { maxImportance: baseFilter.maxImportance }),
      ...(baseFilter.createdAtFrom && { createdAtFrom: baseFilter.createdAtFrom }),
      ...(baseFilter.createdAtTo && { createdAtTo: baseFilter.createdAtTo }),
    };
  }

  const withMsgDefaults: ISyntagmaMemQueryFilter = {
    ...effectiveFilter,
    ...(effectiveFilter.projectId === undefined
      && projectIdFromMsg
      && { projectId: projectIdFromMsg }),
    ...(effectiveFilter.taskId === undefined
      && taskIdFromMsg
      && { taskId: taskIdFromMsg }),
    ...(effectiveFilter.ownerAgentId === undefined
      && agentIdFromMsg
      && { ownerAgentId: agentIdFromMsg }),
    ...(effectiveFilter.ownerRoleKey === undefined
      && roleKeyFromMsg
      && { ownerRoleKey: roleKeyFromMsg }),
  };

  return withMsgDefaults;
}

function buildMongoFilter(
  scopes: SYNTAGMA_MEM_SCOPE[],
  baseFilter: ISyntagmaMemQueryFilter | undefined,
  projectIdFromMsg: string | undefined,
  taskIdFromMsg: string | undefined,
  agentIdFromMsg: string | undefined,
  roleKeyFromMsg: string | undefined,
  textSearch: string | undefined
): IMongoFilter {
  const scopePart: IMongoFilter = scopes.length === 1
    ? { scope: scopes[0] }
    : {
      scope: {
        $in: scopes,
      },
    };
  const effectiveFilter = buildEffectiveFilter(baseFilter, projectIdFromMsg, taskIdFromMsg, agentIdFromMsg, roleKeyFromMsg);
  let importanceFilter: INumberRangeFilter | undefined;

  if (typeof effectiveFilter.minImportance === 'number') {
    importanceFilter = {
      ...(importanceFilter || {}),
      $gte: effectiveFilter.minImportance,
    };
  }
  if (typeof effectiveFilter.maxImportance === 'number') {
    importanceFilter = {
      ...(importanceFilter || {}),
      $lte: effectiveFilter.maxImportance,
    };
  }

  let createdAtFilter: IStringRangeFilter | undefined;

  if (effectiveFilter.createdAtFrom) {
    createdAtFilter = {
      ...(createdAtFilter || {}),
      $gte: effectiveFilter.createdAtFrom,
    };
  }
  if (effectiveFilter.createdAtTo) {
    createdAtFilter = {
      ...(createdAtFilter || {}),
      $lte: effectiveFilter.createdAtTo,
    };
  }

  let tagsFilter: ITagsFilter | undefined;

  if (effectiveFilter.tagsIncludeAny && effectiveFilter.tagsIncludeAny.length > 0) {
    tagsFilter = {
      ...(tagsFilter || {}),
      $in: effectiveFilter.tagsIncludeAny,
    };
  }
  if (effectiveFilter.tagsIncludeAll && effectiveFilter.tagsIncludeAll.length > 0) {
    tagsFilter = {
      ...(tagsFilter || {}),
      $all: effectiveFilter.tagsIncludeAll,
    };
  }

  const trimmedSearch = textSearch ? textSearch.trim() : '';
  const hasSearch = trimmedSearch.length > 0;
  let textFilter: ITextFilter | undefined;

  if (hasSearch) {
    textFilter = {
      $search: trimmedSearch,
    };
  }

  const mongoFilter: IMongoFilter = {
    ...scopePart,
    ...(effectiveFilter.projectId && { projectId: effectiveFilter.projectId }),
    ...(effectiveFilter.taskId && { taskId: effectiveFilter.taskId }),
    ...(effectiveFilter.ownerAgentId && { ownerAgentId: effectiveFilter.ownerAgentId }),
    ...(effectiveFilter.ownerRoleKey && { ownerRoleKey: effectiveFilter.ownerRoleKey }),
    ...(effectiveFilter.authorAgentId && { authorAgentId: effectiveFilter.authorAgentId }),
    ...(effectiveFilter.authorRoleKey && { authorRoleKey: effectiveFilter.authorRoleKey }),
    ...(effectiveFilter.audience && { audience: effectiveFilter.audience }),
    ...(importanceFilter && { importance: importanceFilter }),
    ...(createdAtFilter && { createdAt: createdAtFilter }),
    ...(tagsFilter && { tags: tagsFilter }),
    ...(textFilter && { $text: textFilter }),
  };

  return mongoFilter;
}

function computeCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  const lengthA = vectorA.length;
  const lengthB = vectorB.length;

  if (lengthA === 0 || lengthB === 0 || lengthA !== lengthB) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < lengthA; i += 1) {
    const a = vectorA[i];
    const b = vectorB[i];

    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function findBestEmbeddingSimilarity(entry: ISyntagmaMemEntry, queryEmbedding: ISyntagmaMemEmbedding): number | null {
  if (!entry.embeddings || entry.embeddings.length === 0) {
    return null;
  }

  let best: number | null = null;

  for (let i = 0; i < entry.embeddings.length; i += 1) {
    const embedding = entry.embeddings[i];

    if (embedding.providerKey !== queryEmbedding.providerKey) {
      continue;
    }
    if (embedding.modelKey !== queryEmbedding.modelKey) {
      continue;
    }

    const similarity = computeCosineSimilarity(embedding.vector, queryEmbedding.vector);

    if (best === null || similarity > best) {
      best = similarity;
    }
  }

  return best;
}

function sortResults(items: ISyntagmaMemQueryResultItem[], sort: ISyntagmaMemQuerySort[]): void {
  if (sort.length === 0) {
    return;
  }
  items.sort((left, right) => {
    for (let i = 0; i < sort.length; i += 1) {
      const rule = sort[i];
      let leftValue: number | string | undefined;
      let rightValue: number | string | undefined;

      if (rule.field === SYNTAGMA_MEM_QUERY_SORT_FIELD.SIMILARITY) {
        leftValue = typeof left.similarityScore === 'number' ? left.similarityScore : -Infinity;
        rightValue = typeof right.similarityScore === 'number' ? right.similarityScore : -Infinity;
      } else if (rule.field === SYNTAGMA_MEM_QUERY_SORT_FIELD.CREATED_AT) {
        leftValue = left.entry.createdAt;
        rightValue = right.entry.createdAt;
      } else if (rule.field === SYNTAGMA_MEM_QUERY_SORT_FIELD.IMPORTANCE) {
        leftValue = typeof left.entry.importance === 'number' ? left.entry.importance : 0;
        rightValue = typeof right.entry.importance === 'number' ? right.entry.importance : 0;
      }
      if (leftValue === undefined && rightValue === undefined) {
        continue;
      }
      if (leftValue === undefined) {
        return rule.order === SYNTAGMA_MEM_QUERY_SORT_ORDER.ASC ? 1 : -1;
      }
      if (rightValue === undefined) {
        return rule.order === SYNTAGMA_MEM_QUERY_SORT_ORDER.ASC ? -1 : 1;
      }
      if (leftValue < rightValue) {
        return rule.order === SYNTAGMA_MEM_QUERY_SORT_ORDER.ASC ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return rule.order === SYNTAGMA_MEM_QUERY_SORT_ORDER.ASC ? 1 : -1;
      }
    }

    return 0;
  });
}

async function handleInput(
  node: INode,
  config: ISyntagmaMemQueryNodeConfig,
  mongoConfigNode: ISyntagmaMongoConfigNode,
  msg: ISyntagmaMemQueryOutMsg,
  send: (outMsg: ISyntagmaMemQueryOutMsg) => void,
  done: (err?: unknown) => void
): Promise<void> {
  try {
    const db = await mongoConfigNode.connectionManager.getDb();
    const collection = db.collection<ISyntagmaMemEntry>(config.collectionName || 'syntagma_mem');
    const incomingQuery = msg.memQuery;
    const scopes = getEffectiveScopes(config, incomingQuery ? incomingQuery.filter : undefined);
    const limit = normalizeLimit(config, incomingQuery);
    const offset = normalizeOffset(incomingQuery);
    const vectorConfig = normalizeVectorConfig(config, incomingQuery);
    const hasQueryEmbedding = config.enableVectorSearch === true
      && incomingQuery?.queryEmbedding !== undefined;
    const sort = normalizeSort(config, incomingQuery, hasQueryEmbedding);
    const mongoFilter = buildMongoFilter(
      scopes,
      incomingQuery ? incomingQuery.filter : undefined,
      msg.projectId,
      msg.taskId,
      msg.agentId,
      msg.roleKey,
      incomingQuery ? incomingQuery.textSearch : undefined
    );
    const entries = await collection.find(mongoFilter).toArray();
    const resultItems: ISyntagmaMemQueryResultItem[] = [];
    let queryEmbedding: ISyntagmaMemEmbedding | undefined;

    if (hasQueryEmbedding && incomingQuery?.queryEmbedding) {
      queryEmbedding = incomingQuery.queryEmbedding;
    }

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const item: ISyntagmaMemQueryResultItem = {
        entry,
      };

      if (queryEmbedding) {
        const similarity = findBestEmbeddingSimilarity(entry, queryEmbedding);

        if (similarity !== null) {
          if (typeof vectorConfig.similarityThreshold === 'number') {
            if (similarity >= vectorConfig.similarityThreshold) {
              item.similarityScore = similarity;
            } else {
              continue;
            }
          } else {
            item.similarityScore = similarity;
          }
        } else if (config.enableVectorSearch === true) {
          continue;
        }
      }
      resultItems.push(item);
    }

    if (
      queryEmbedding
      && typeof vectorConfig.topK === 'number'
      && vectorConfig.topK > 0
      && resultItems.length > vectorConfig.topK
    ) {
      sortResults(resultItems, [
        {
          field: SYNTAGMA_MEM_QUERY_SORT_FIELD.SIMILARITY,
          order: SYNTAGMA_MEM_QUERY_SORT_ORDER.DESC,
        },
      ]);
      resultItems.splice(vectorConfig.topK);
    }
    sortResults(resultItems, sort);
    const total = resultItems.length;
    const start = offset < total ? offset : total;
    const end = start + limit <= total ? start + limit : total;
    const pagedItems = resultItems.slice(start, end);
    const result: ISyntagmaMemQueryResult = {
      total,
      limit,
      offset: start,
      items: pagedItems,
    };

    msg.memQueryResult = result;
    msg.errorMessage = undefined;
    send(msg);
    done();
  } catch (unknownError: unknown) {
    let errorMessage = 'Unknown error in syntagma-mem-query';
    let errorForDone: Error | undefined;

    if (unknownError instanceof Error) {
      errorMessage = unknownError.message;
      errorForDone = unknownError;
    } else {
      errorForDone = new Error(errorMessage);
    }

    msg.errorMessage = errorMessage;
    node.error(errorMessage);
    done(errorForDone);
  }
}

const syntagmaMemQueryNodeFactory = (RED: ISyntagmaRED): void => {
  function SyntagmaMemQueryNode(this: INode, config: unknown): void {
    assertIsMemQueryNodeConfig(config);

    RED.nodes.createNode(this, config);

    const maybeMongoNode = RED.nodes.getNode(config.mongoConfig);
    const mongoConfigNode = isMongoConfigNode(maybeMongoNode) ? maybeMongoNode : null;
    const collectionName = config.collectionName || 'syntagma_mem';
    const normalizedConfig: ISyntagmaMemQueryNodeConfig = {
      mongoConfig: config.mongoConfig,
      collectionName,
      defaultScopes: config.defaultScopes,
      defaultLimit: config.defaultLimit,
      maxLimit: config.maxLimit,
      enableVectorSearch: config.enableVectorSearch,
      defaultTopK: config.defaultTopK,
      defaultSimilarityThreshold: config.defaultSimilarityThreshold,
      defaultSortField: config.defaultSortField,
      defaultSortOrder: config.defaultSortOrder,
      name: config.name,
    };

    this.on('input', (...args: unknown[]): void => {
      if (args.length < 3) return;

      const maybeMsg = args[0];
      const maybeSend = args[1];
      const maybeDone = args[2];

      if (!isMemQueryMsg(maybeMsg)) {
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
      const send = (m: ISyntagmaMemQueryOutMsg): void => {
        maybeSend(m);
      };
      const done = (err?: unknown): void => {
        maybeDone(err);
      };

      if (!mongoConfigNode) {
        const errorMessage = 'Mongo config node not found for syntagma-mem-query';

        this.error(errorMessage);
        msg.errorMessage = errorMessage;
        msg.memQueryResult = {
          total: 0,
          limit: 0,
          offset: 0,
          items: [],
        };

        send(msg);
        done(new Error(errorMessage));

        return;
      }

      void handleInput(this, normalizedConfig, mongoConfigNode, msg, send, done);
    });
  }

  RED.nodes.registerType('syntagma-mem-query', SyntagmaMemQueryNode);
};

export = syntagmaMemQueryNodeFactory;
