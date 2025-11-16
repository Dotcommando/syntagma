import registerChatAbstractNode from './chat/syntagma-chat-abstract.node';
import registerMemQueryNode from './mem/syntagma-mem-query';
import registerMemWriteNode from './mem/syntagma-mem-write';
import type { ISyntagmaRED } from './mongo/mongo-connection.types';
import registerMongoConfigNode from './mongo/syntagma-mongo-config.node';
import registerMongoTestNode from './mongo/syntagma-mongo-test.node';
import registerProjectConfigNode from './project/syntagma-project-config.node';

function syntagmaCore(RED: ISyntagmaRED): void {
  registerMongoConfigNode(RED);
  registerMongoTestNode(RED);
  registerProjectConfigNode(RED);
  registerChatAbstractNode(RED);
  registerMemWriteNode(RED);
  registerMemQueryNode(RED);
}

export = syntagmaCore;
