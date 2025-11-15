import type { ISyntagmaRED } from './mongo/mongo-connection.types';
import { registerMongoConfigNode } from './mongo/syntagma-mongo-config.node';

function syntagmaCore(RED: ISyntagmaRED): void {
  registerMongoConfigNode(RED);
}

export = syntagmaCore;
