import type { INode } from '../types';
import type { ISyntagmaMongoConnectionManager } from './mongo-connection.types';
import type { ISyntagmaMongoEnvConfig } from './mongo-env.types';

export type TSyntagmaMongoConfigSource = 'env' | 'node';

export interface ISyntagmaMongoEffectiveConfig {
  url: string;
  dbName: string;
  source: TSyntagmaMongoConfigSource;
  envVarName?: string;
  rawFromEnv?: string;
  rawFromNode?: string;
}

export interface ISyntagmaMongoConfigNodeDef {
  id: string;
  type: string;
  name?: string;
  envVarName?: string;
  preferEnvUrl?: boolean;
  url?: string;
  dbName?: string;
}

export interface ISyntagmaMongoConfigNode extends INode {
  name?: string;
  envVarName: string;
  preferEnvUrl: boolean;
  url: string;
  dbName: string;
  effectiveConfig: ISyntagmaMongoEffectiveConfig;
  connectionManager: ISyntagmaMongoConnectionManager;
}

export interface ISyntagmaMongoConfigResolver {
  resolve(
    def: ISyntagmaMongoConfigNodeDef,
    envConfig: ISyntagmaMongoEnvConfig
  ): ISyntagmaMongoEffectiveConfig;
}
