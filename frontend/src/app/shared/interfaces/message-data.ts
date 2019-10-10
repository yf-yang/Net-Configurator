export interface MessageData {
  id?: string;
  name: string;
  bandwidth: number;
  priority: number;
  max_latency: number;
  max_jitter: number;
}
