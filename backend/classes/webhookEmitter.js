import { EventEmitter } from "node:events";
class WebhookEmitter extends EventEmitter {}
export const webhookEmitter = new WebhookEmitter();
