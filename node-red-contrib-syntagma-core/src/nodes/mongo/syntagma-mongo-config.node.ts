import type { INode } from '../types';
import { SyntagmaMongoConfigResolver } from './mongo-config.resolver';
import type {
  ISyntagmaMongoConfigNodeDef,
  ISyntagmaMongoEffectiveConfig
} from './mongo-config.types';
import type {
  ISyntagmaMongoConnectionManager,
  ISyntagmaMongoConnectionManagerFactory,
  ISyntagmaMongoRegistry,
  ISyntagmaRED,
  ISyntagmaRedSettings
} from './mongo-connection.types';
import { SyntagmaMongoConnectionManager } from './mongo-connection-manager';
import { SyntagmaMongoEnvResolver } from './mongo-env.resolver';
import { SyntagmaMongoRegistry } from './mongo-registry';

class DefaultMongoConnectionManagerFactory implements ISyntagmaMongoConnectionManagerFactory {
  create(config: ISyntagmaMongoEffectiveConfig): ISyntagmaMongoConnectionManager {
    return new SyntagmaMongoConnectionManager(config);
  }
}

function syntagmaMongoConfigNode(RED: ISyntagmaRED): void {
  const envResolver = new SyntagmaMongoEnvResolver();
  const configResolver = new SyntagmaMongoConfigResolver();
  const factory = new DefaultMongoConnectionManagerFactory();
  const settings: ISyntagmaRedSettings = RED.settings;
  const ensuredRegistry: ISyntagmaMongoRegistry = settings.syntagmaMongoRegistry
    || (settings.syntagmaMongoRegistry = new SyntagmaMongoRegistry());

  function MongoConfigNode(this: INode, config: ISyntagmaMongoConfigNodeDef): void {
    RED.nodes.createNode(this, config);

    const envConfig = envResolver.resolve(config.envVarName);
    const effectiveConfig = configResolver.resolve(config, envConfig);

    this.name = config.name;
    this.envVarName = envConfig.envVarName;
    this.preferEnvUrl = config.preferEnvUrl === true;
    this.url = typeof config.url === 'string' ? config.url : '';
    this.dbName = typeof config.dbName === 'string' && config.dbName.trim().length > 0
        ? config.dbName.trim()
        : effectiveConfig.dbName;
    this.effectiveConfig = effectiveConfig;

    this.connectionManager = ensuredRegistry.getOrCreateManager(
      this.id,
      effectiveConfig,
      factory
    );

    this.on('close', (...args: unknown[]) => {
      const maybeDone = args[0];

      if (typeof maybeDone === 'function') {
        const done = maybeDone;

        ensuredRegistry
          .destroyManager(this.id)
          .then(() => {
            done();
          })
          .catch((error: unknown) => {
            let message = 'Failed to close MongoDB connection';

            if (error instanceof Error) {
              message = error.message;
            }

            this.error(message);
            done();
          });
      }
    });
  }

  RED.nodes.registerType<ISyntagmaMongoConfigNodeDef>(
    'syntagma-mongo-config',
    MongoConfigNode
  );
}

export = syntagmaMongoConfigNode;
