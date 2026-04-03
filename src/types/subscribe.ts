export type SubscribeRequest = {
  email: string;
};

export type SubscribeResponse = {
  ok: boolean;
  already_subscribed?: boolean;
};
