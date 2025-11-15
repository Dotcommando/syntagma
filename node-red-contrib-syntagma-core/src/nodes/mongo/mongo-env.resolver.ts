import type { ISyntagmaMongoEnvConfig, ISyntagmaMongoEnvResolver } from './mongo-env.types';

export class SyntagmaMongoEnvResolver implements ISyntagmaMongoEnvResolver {
  readonly defaultEnvVarNames: string[];

  constructor() {
    this.defaultEnvVarNames = [
      'MONGO_URL',
      'SYNTAGMA_MONGO_URL',
      'MONGODB_URI',
      'MONGODB_URL',
      'MONGODB_CONNECTION_STRING',
      'MONGO_CONNECTION_STRING'
    ];
  }

  resolve(customEnvVarName?: string): ISyntagmaMongoEnvConfig {
    const trimmed = typeof customEnvVarName === 'string' ? customEnvVarName.trim() : '';
    const candidates = trimmed.length > 0 ? [trimmed] : this.defaultEnvVarNames;

    for (const name of candidates) {
      const value = process.env[name];

      if (typeof value === 'string') {
        const url = value.trim();

        if (url.length > 0) {
          return { envVarName: name, urlFromEnv: url };
        }
      }
    }

    const envVarName = candidates.length > 0 ? candidates[0] : 'MONGO_URL';

    return {
      envVarName,
      urlFromEnv: undefined
    };
  }
}
