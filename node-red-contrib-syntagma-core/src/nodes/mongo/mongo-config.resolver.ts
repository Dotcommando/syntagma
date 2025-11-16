import type {
  ISyntagmaMongoConfigNodeDef,
  ISyntagmaMongoConfigResolver,
  ISyntagmaMongoEffectiveConfig,
} from './mongo-config.types';
import type { ISyntagmaMongoEnvConfig } from './mongo-env.types';

export class SyntagmaMongoConfigResolver implements ISyntagmaMongoConfigResolver {
  resolve(
    def: ISyntagmaMongoConfigNodeDef,
    envConfig: ISyntagmaMongoEnvConfig
  ): ISyntagmaMongoEffectiveConfig {
    const envUrl = typeof envConfig.urlFromEnv === 'string' ? envConfig.urlFromEnv : '';
    const nodeUrl = typeof def.url === 'string' ? def.url : '';
    const preferEnv = def.preferEnvUrl === true;
    const dbName = typeof def.dbName === 'string' && def.dbName.trim().length > 0
        ? def.dbName.trim()
        : 'syntagma';
    const envVarName = typeof def.envVarName === 'string' && def.envVarName.trim().length > 0
        ? def.envVarName.trim()
        : envConfig.envVarName;

    if (preferEnv && envUrl.length > 0) {
      return {
        url: envUrl,
        dbName,
        source: 'env',
        envVarName,
        rawFromEnv: envUrl,
        rawFromNode: nodeUrl,
      };
    }
    if (nodeUrl.length > 0) {
      return {
        url: nodeUrl,
        dbName,
        source: 'node',
        envVarName,
        rawFromEnv: envUrl,
        rawFromNode: nodeUrl,
      };
    }
    if (envUrl.length > 0) {
      return {
        url: envUrl,
        dbName,
        source: 'env',
        envVarName,
        rawFromEnv: envUrl,
        rawFromNode: nodeUrl,
      };
    }

    return {
      url: '',
      dbName,
      source: preferEnv ? 'env' : 'node',
      envVarName,
      rawFromEnv: envUrl,
      rawFromNode: nodeUrl,
    };
  }
}
