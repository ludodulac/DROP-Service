import { createHmac, timingSafeEqual } from "node:crypto";
import type { WebhookParams } from "./types";

function appendParam(name: string, value: string | string[]) {
  if (Array.isArray(value)) {
    return [...new Set(value)]
      .sort()
      .map((item) => `${name}${item}`)
      .join("");
  }
  return `${name}${value}`;
}

export function getExpectedTwilioSignature(
  authToken: string,
  url: string,
  params: WebhookParams,
) {
  const data = Object.keys(params)
    .sort()
    .reduce((accumulator, key) => accumulator + appendParam(key, params[key]), url);

  return createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf8"))
    .digest("base64");
}

export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: WebhookParams,
) {
  if (!authToken || !signature) return false;
  const expected = Buffer.from(getExpectedTwilioSignature(authToken, url, params));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function formDataToWebhookParams(formData: FormData): WebhookParams {
  const params: WebhookParams = {};
  for (const [key, rawValue] of formData.entries()) {
    if (typeof rawValue !== "string") continue;
    const current = params[key];
    if (current === undefined) params[key] = rawValue;
    else if (Array.isArray(current)) current.push(rawValue);
    else params[key] = [current, rawValue];
  }
  return params;
}

export function getWebhookParam(params: WebhookParams, name: string) {
  const value = params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
