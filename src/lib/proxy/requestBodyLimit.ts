/**
 * Request-body ceiling for the proxy's POST routes.
 *
 * The body is read before anything else about the request is known (the model,
 * the share token), so it is bounded first, chunk by chunk, the way the server
 * adapters bound theirs.
 *
 * @module proxy/requestBodyLimit
 */

import {
  RawBodyTooLargeError,
  readBoundedRequestBody,
  tryParseByteLimit,
} from "../server/utils/rawBody.js";
import { logger } from "../utils/logger.js";

/** Environment variable that overrides the ceiling: a byte count, or `64mb` / `512kb` / `1gb`. */
export const PROXY_MAX_REQUEST_BODY_ENV =
  "NEUROLINK_PROXY_MAX_REQUEST_BODY_BYTES";

/**
 * 32 MiB. The Claude Messages API documents a 32 MB maximum request size and
 * answers a larger request with 413 `request_too_large`, so a larger body
 * cannot be served by the route the proxy exists for:
 * https://platform.claude.com/docs/en/api/errors#request-size-limits
 *
 * The other upstreams the proxy fronts document higher figures (Gemini: 100 MB
 * inline per request, https://ai.google.dev/gemini-api/docs/file-input-methods;
 * OpenAI: 512 MB total payload for image inputs,
 * https://developers.openai.com/api/docs/guides/images-vision). A client that
 * sends more than 32 MiB through those routes raises the ceiling with
 * `NEUROLINK_PROXY_MAX_REQUEST_BODY_BYTES`.
 */
export const DEFAULT_PROXY_MAX_REQUEST_BODY_BYTES = 32 * 1024 * 1024;

let warnedAbout: string | undefined;

/** The ceiling in bytes: the environment override when it is a positive size, else the default. */
export function resolveProxyMaxRequestBodyBytes(
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = env[PROXY_MAX_REQUEST_BODY_ENV]?.trim();
  if (!raw) {
    return DEFAULT_PROXY_MAX_REQUEST_BODY_BYTES;
  }
  const parsed = tryParseByteLimit(raw);
  if (parsed !== undefined && parsed > 0) {
    return parsed;
  }
  if (warnedAbout !== raw) {
    warnedAbout = raw;
    logger.always(
      `[proxy] ignoring ${PROXY_MAX_REQUEST_BODY_ENV}=${JSON.stringify(raw)}: expected a positive byte count or a size such as 64mb; using ${DEFAULT_PROXY_MAX_REQUEST_BODY_BYTES} bytes`,
    );
  }
  return DEFAULT_PROXY_MAX_REQUEST_BODY_BYTES;
}

/**
 * The request body as text, `undefined` when it cannot be read (a client that
 * hung up mid-body), or the error when it is over the ceiling. Over the ceiling
 * the stream is cancelled, so nothing past it is buffered.
 */
export async function readProxyRequestText(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): Promise<string | undefined | RawBodyTooLargeError> {
  try {
    const bytes = await readBoundedRequestBody(
      request,
      resolveProxyMaxRequestBodyBytes(env),
    );
    return bytes instanceof RawBodyTooLargeError
      ? bytes
      : new TextDecoder().decode(bytes);
  } catch {
    return undefined;
  }
}
