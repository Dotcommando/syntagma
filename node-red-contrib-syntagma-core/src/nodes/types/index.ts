export interface INode {
  id: string;
  type: string;
  name?: string;
  send(msg: unknown): void;
  error(message: string): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  [key: string]: unknown;
}

export interface IREDNodes {
  createNode(node: unknown, config: unknown): void;
  getNode(id: string): unknown;
  registerType<TConfig = unknown>(
    name: string,
    ctor: (this: INode, config: TConfig) => void,
    options?: unknown
  ): void;
}

export interface IRED {
  nodes: IREDNodes;
  settings?: Record<string, unknown>;
}
