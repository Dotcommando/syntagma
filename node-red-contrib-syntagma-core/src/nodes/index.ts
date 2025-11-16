import type { ISyntagmaRED } from './mongo/mongo-connection.types';
import registerMongoConfigNode from './mongo/syntagma-mongo-config.node';
import registerProjectConfigNode from './project/syntagma-project-config.node';

function syntagmaCore(RED: ISyntagmaRED): void {
  registerMongoConfigNode(RED);
  registerProjectConfigNode(RED);
}

export = syntagmaCore;
