import type { INode } from '../types';
import type {
  ISyntagmaMongoConfigNode,
  ISyntagmaMongoConfigNodeDef
} from './mongo-config.types';
import type { ISyntagmaRED } from './mongo-connection.types';

interface IMongoTestNodeDef extends ISyntagmaMongoConfigNodeDef {
  mongo?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSyntagmaMongoConfigNode(value: unknown): value is ISyntagmaMongoConfigNode {
  if (!isRecord(value)) {
    return false;
  }

  const maybeConnectionManager = value.connectionManager;

  if (!isRecord(maybeConnectionManager)) {
    return false;
  }

  const getDb = maybeConnectionManager.getDb;

  return typeof getDb === 'function';
}

function syntagmaMongoTestNode(RED: ISyntagmaRED): void {
  function MongoTestNode(this: INode, config: IMongoTestNodeDef): void {
    RED.nodes.createNode(this, config);

    this.mongo = config.mongo;

    const rawConfigNode = typeof config.mongo === 'string' ? RED.nodes.getNode(config.mongo) : undefined;

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

      if (!isRecord(msg)) {
        this.error('Incoming msg is not an object');

        if (done) {
          done();
        }

        return;
      }

      const configNode = this.mongoConfig;

      if (!isSyntagmaMongoConfigNode(configNode)) {
        this.status({ fill: 'red', shape: 'ring', text: 'no mongo config' });
        msg.payload = {
          ok: false,
          error: 'Mongo config node is not available'
        };
        send(msg);

        if (done) {
          done();
        }

        return;
      }

      const effectiveConfig = configNode.effectiveConfig;

      this.status({ fill: 'yellow', shape: 'ring', text: 'pinging...' });

      configNode.connectionManager
        .getDb()
        .then(db => db.command({ ping: 1 }))
        .then(result => {
          this.status({ fill: 'green', shape: 'dot', text: 'ping ok' });

          msg.payload = {
            ok: true,
            ping: result,
            config: {
              url: effectiveConfig.url,
              dbName: effectiveConfig.dbName,
              source: effectiveConfig.source,
              envVarName: effectiveConfig.envVarName,
              rawFromEnv: effectiveConfig.rawFromEnv,
              rawFromNode: effectiveConfig.rawFromNode
            },
            at: new Date().toISOString()
          };

          send(msg);

          if (done) {
            done();
          }
        })
        .catch(error => {
          let message = 'Mongo ping failed';

          if (error instanceof Error) {
            message = error.message;
          }

          this.status({ fill: 'red', shape: 'dot', text: 'ping failed' });
          this.error(message);

          msg.payload = {
            ok: false,
            error: message,
            config: {
              url: effectiveConfig.url,
              dbName: effectiveConfig.dbName,
              source: effectiveConfig.source,
              envVarName: effectiveConfig.envVarName,
              rawFromEnv: effectiveConfig.rawFromEnv,
              rawFromNode: effectiveConfig.rawFromNode
            },
            at: new Date().toISOString()
          };

          send(msg);

          if (done) {
            done();
          }
        });
    });
  }

  RED.nodes.registerType<IMongoTestNodeDef>('syntagma-mongo-test', MongoTestNode);
}

export = syntagmaMongoTestNode;
