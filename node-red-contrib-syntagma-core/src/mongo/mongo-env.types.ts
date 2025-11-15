export interface ISyntagmaMongoEnvConfig {
  envVarName: string;
  urlFromEnv?: string;
}

export interface ISyntagmaMongoEnvResolver {
  readonly defaultEnvVarNames: string[];
  resolve(customEnvVarName?: string): ISyntagmaMongoEnvConfig;
}
