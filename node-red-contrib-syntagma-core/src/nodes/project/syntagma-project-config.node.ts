import type { INode, IRED } from '../types';
import { assertIsSyntagmaProjectConfig } from './syntagma-project-config.assertions';
import type { ISyntagmaProjectConfig, ISyntagmaProjectConfigNodeDef } from './syntagma-project-config.types';

function syntagmaProjectConfigNode(RED: IRED): void {
  function ProjectConfigNode(this: INode, config: ISyntagmaProjectConfigNodeDef): void {
    RED.nodes.createNode(this, config);

    const nodeName = typeof config.name === 'string' ? config.name : '';

    if (nodeName.length > 0) {
      this.name = nodeName;
    }

    const rawJson = typeof config.configJson === 'string' ? config.configJson.trim() : '';

    if (rawJson.length === 0) {
      this.status({ fill: 'red', shape: 'ring', text: 'no config json' });
      this.error('Project config JSON is empty');

      return;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawJson);
    } catch (error) {
      this.status({ fill: 'red', shape: 'dot', text: 'invalid json' });
      const message = error instanceof Error ? error.message : 'Failed to parse project config JSON';

      this.error(message);

      return;
    }

    try {
      assertIsSyntagmaProjectConfig(parsed);
    } catch (error) {
      this.status({ fill: 'red', shape: 'dot', text: 'invalid config' });
      const message = error instanceof Error ? error.message : 'Project config validation error';

      this.error(message);

      return;
    }

    const configObject: ISyntagmaProjectConfig = parsed;
    const explicitProjectId = typeof config.projectId === 'string' ? config.projectId.trim() : '';

    this['projectId'] = explicitProjectId.length > 0 ? explicitProjectId : configObject.projectId;
    this['config'] = configObject;

    this.status({ fill: 'green', shape: 'dot', text: 'ready' });
  }

  RED.nodes.registerType<ISyntagmaProjectConfigNodeDef>(
    'syntagma-project-config',
    ProjectConfigNode
  );
}

export = syntagmaProjectConfigNode;
