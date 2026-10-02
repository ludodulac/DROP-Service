import type { WebhookParams } from "./types";

export function formDataToWebhookParams(formData: FormData): WebhookParams {
  const params: WebhookParams = {};

  for (const [key, rawValue] of formData.entries()) {
    if (typeof rawValue !== "string") continue;

    const current = params[key];
    if (current === undefined) {
      params[key] = rawValue;
    } else if (Array.isArray(current)) {
      current.push(rawValue);
    } else {
      params[key] = [current, rawValue];
    }
  }

  return params;
}

export function getWebhookParam(params: WebhookParams, name: string) {
  const value = params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function isTwilioCallSid(value: string) {
  return /^CA[0-9a-f]{32}$/i.test(value);
}
