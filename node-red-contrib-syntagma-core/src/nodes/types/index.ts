export interface INode {
  id: string;
  type: string;
  name?: string;

  send(msg: unknown): void;
  error(message: string): void;
  status(status: { fill: string; shape: string; text: string }): void;
  on(event: string, handler: (...args: unknown[]) => void): void;

  // custom fields used by specific nodes
  mongo?: unknown;
  mongoConfig?: unknown;

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
