import type { ISyntagmaMongoEffectiveConfig } from './mongo-config.types';
import type {
  ISyntagmaMongoConnectionManager,
  ISyntagmaMongoConnectionManagerFactory,
  ISyntagmaMongoRegistry
} from './mongo-connection.types';

export class SyntagmaMongoRegistry implements ISyntagmaMongoRegistry {
  private managers: Record<string, ISyntagmaMongoConnectionManager>;

  constructor() {
    this.managers = {};
  }

  getOrCreateManager(
    key: string,
    config: ISyntagmaMongoEffectiveConfig,
    factory: ISyntagmaMongoConnectionManagerFactory
  ): ISyntagmaMongoConnectionManager {
    const existing = this.managers[key];

    if (existing) {
      return existing;
    }

    const manager = factory.create(config);

    this.managers[key] = manager;

    return manager;
  }

  getManager(key: string): ISyntagmaMongoConnectionManager | undefined {
    return this.managers[key];
  }

  async destroyManager(key: string): Promise<void> {
    const manager = this.managers[key];

    if (!manager) {
      return;
    }

    delete this.managers[key];
    await manager.close();
  }
}
