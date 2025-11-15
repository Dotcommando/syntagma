import type { Db, MongoClient } from 'mongodb';

import type { IRED } from '../types';
import type { ISyntagmaMongoEffectiveConfig } from './mongo-config.types';

export interface ISyntagmaMongoConnectionManager {
  readonly config: ISyntagmaMongoEffectiveConfig;
  getClient(): Promise<MongoClient>;
  getDb(): Promise<Db>;
  close(): Promise<void>;
}

export interface ISyntagmaMongoConnectionManagerFactory {
  create(config: ISyntagmaMongoEffectiveConfig): ISyntagmaMongoConnectionManager;
}

export interface ISyntagmaMongoRegistry {
  getOrCreateManager(
    key: string,
    config: ISyntagmaMongoEffectiveConfig,
    factory: ISyntagmaMongoConnectionManagerFactory
  ): ISyntagmaMongoConnectionManager;

  getManager(key: string): ISyntagmaMongoConnectionManager | undefined;

  destroyManager(key: string): Promise<void>;
}

export interface ISyntagmaRedSettings {
  syntagmaMongoRegistry?: ISyntagmaMongoRegistry;
  [key: string]: unknown;
}

export interface ISyntagmaRED extends IRED {
  settings: ISyntagmaRedSettings;
}
