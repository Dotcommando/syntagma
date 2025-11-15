import { MongoClient } from 'mongodb';

import type { ISyntagmaMongoEffectiveConfig } from './mongo-config.types';
import type {
  ISyntagmaMongoConnectionManager
} from './mongo-connection.types';

export class SyntagmaMongoConnectionManager implements ISyntagmaMongoConnectionManager {
  readonly config: ISyntagmaMongoEffectiveConfig;
  private client?: MongoClient;

  constructor(config: ISyntagmaMongoEffectiveConfig) {
    this.config = config;
  }

  async getClient(): Promise<MongoClient> {
    if (this.client) {
      return this.client;
    }
    if (this.config.url.length === 0) {
      throw new Error('MongoDB URL is empty');
    }

    const client = new MongoClient(this.config.url);

    this.client = client;
    await client.connect();

    return client;
  }

  async getDb() {
    const client = await this.getClient();

    return client.db(this.config.dbName);
  }

  async close(): Promise<void> {
    if (!this.client) {
      return;
    }

    const client = this.client;

    this.client = undefined;
    await client.close();
  }
}
