export interface NodeDataQuery {
  name?: string;
  IP?: string;
  MAC?: string;
  node_type?: string;
  model?: string;
  interface?: string;
  unicast?: {
    IP?: string;
    MAC?: string;
  };
  [prop: string]: any;
}
