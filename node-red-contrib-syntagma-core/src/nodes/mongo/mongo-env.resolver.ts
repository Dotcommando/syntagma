import type { ISyntagmaMongoEnvConfig, ISyntagmaMongoEnvResolver } from './mongo-env.types';

export class SyntagmaMongoEnvResolver implements ISyntagmaMongoEnvResolver {
  readonly defaultEnvVarNames: string[];

  constructor() {
    this.defaultEnvVarNames = ['SYNTAGMA_MONGO_URL', 'MONGO_URL'];
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

    const envVarName = candidates.length > 0 ? candidates[0] : 'SYNTAGMA_MONGO_URL';

    return {
      envVarName,
      urlFromEnv: undefined
    };
  }
}
