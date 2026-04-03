export type LogActivityPayload = {
  agent_name: string;
  action_type: string;
  store_id?: string;
  payload?: Record<string, unknown>;
};
