import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import type { Application, Express } from 'express';
import '../config/load-env.js';
import { createApp } from './app.js';
import { isServerlessRuntime } from '../config/runtime.js';
import { validateEnvironment } from '../config/validate-env.js';
import { assertProductionMockDisabled } from '../config/mock-guard.js';
import { registerBuiltInJobHandlers } from '../infrastructure/queue/job-handlers.js';
import { logger } from '../infrastructure/logging/logger.js';

let appInstance: Express | null = null;
let bootstrapped = false;

function bootstrapOnce(): void {
  if (bootstrapped) {
    return;
  }

  process.env.WILMS_RUNTIME ??= 'serverless';
  process.env.WILMS_DEPLOYED_AT ??= new Date().toISOString();

  const envReport = validateEnvironment();
  registerBuiltInJobHandlers();
  assertProductionMockDisabled();

  for (const warning of envReport.warnings) {
    logger.warn('serverless.env.warning', { warning });
  }
  if (!envReport.valid) {
    for (const error of envReport.errors) {
      logger.error('serverless.env.error', { error });
    }
  }

  logger.info('serverless.bootstrap', {
    runtime: isServerlessRuntime() ? 'serverless' : 'node',
    vercel: Boolean(process.env.VERCEL),
  });

  bootstrapped = true;
}

export function getWilmsExpressApp(): Express {
  bootstrapOnce();
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

type MutableResponse = {
  statusCode: number;
  headersSent: boolean;
  writableEnded: boolean;
  finished: boolean;
  setHeader: (name: string, value: string | number | readonly string[]) => MutableResponse;
  getHeader: (name: string) => string | number | readonly string[] | undefined;
  getHeaders: () => Record<string, string | number | readonly string[]>;
  removeHeader: (name: string) => void;
  writeHead: (
    code: number,
    reasonOrHeaders?: string | Record<string, string | number | string[]>,
    maybeHeaders?: Record<string, string | number | string[]>,
  ) => MutableResponse;
  write: (chunk?: unknown, encodingOrCb?: unknown, maybeCb?: unknown) => boolean;
  end: (chunk?: unknown, encodingOrCb?: unknown, maybeCb?: unknown) => MutableResponse;
  on: (...args: unknown[]) => MutableResponse;
  once: (...args: unknown[]) => MutableResponse;
  emit: (...args: unknown[]) => boolean;
  addListener: (...args: unknown[]) => MutableResponse;
  removeListener: (...args: unknown[]) => MutableResponse;
  off: (...args: unknown[]) => MutableResponse;
  destroy: (...args: unknown[]) => MutableResponse;
  cork: () => void;
  uncork: () => void;
  flushHeaders: () => void;
};

/**
 * Serve the WILMS Express application from a Web Fetch Request.
 * `expressPath` must be the path Express expects (e.g. `/api/v1/loans`, `/health`, `/auth/login`).
 */
export async function handleWilmsFetchRequest(
  request: Request,
  options: { expressPath: string },
): Promise<Response> {
  const app = getWilmsExpressApp() as Application;
  const method = request.method.toUpperCase();
  const bodyBuffer =
    method === 'GET' || method === 'HEAD'
      ? Buffer.alloc(0)
      : Buffer.from(await request.arrayBuffer());

  const url = new URL(request.url);
  const headerObject: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headerObject[key] = value;
  });
  if (bodyBuffer.length > 0 && !headerObject['content-length']) {
    headerObject['content-length'] = String(bodyBuffer.length);
  }

  const socket = new Socket();
  const req = Readable.from(bodyBuffer.length > 0 ? [bodyBuffer] : []) as IncomingMessage;
  Object.assign(req, {
    url: `${options.expressPath}${url.search}`,
    method: request.method,
    headers: headerObject,
    httpVersion: '1.1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    socket,
    connection: socket,
    aborted: false,
    complete: true,
  });

  const responseHeaders = new Map<string, string | number | readonly string[]>();
  const bodyChunks: Buffer[] = [];
  let statusCode = 200;
  let ended = false;

  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const res: MutableResponse = {
    statusCode: 200,
    headersSent: false,
    writableEnded: false,
    finished: false,
    setHeader(name, value) {
      responseHeaders.set(name.toLowerCase(), value);
      return res;
    },
    getHeader(name) {
      return responseHeaders.get(name.toLowerCase());
    },
    getHeaders() {
      return Object.fromEntries(responseHeaders.entries());
    },
    removeHeader(name) {
      responseHeaders.delete(name.toLowerCase());
    },
    writeHead(code, reasonOrHeaders, maybeHeaders) {
      statusCode = code;
      res.statusCode = code;
      const headers =
        typeof reasonOrHeaders === 'object' ? reasonOrHeaders : maybeHeaders;
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          responseHeaders.set(key.toLowerCase(), value);
        }
      }
      res.headersSent = true;
      return res;
    },
    write(chunk, encodingOrCb, maybeCb) {
      const cb = typeof encodingOrCb === 'function' ? encodingOrCb : maybeCb;
      if (chunk != null && chunk !== '') {
        bodyChunks.push(
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(typeof chunk === 'string' ? chunk : String(chunk)),
        );
      }
      if (typeof cb === 'function') {
        (cb as (err?: Error | null) => void)();
      }
      return true;
    },
    end(chunk, encodingOrCb, maybeCb) {
      if (chunk != null && typeof chunk !== 'function') {
        res.write(chunk, encodingOrCb);
      }
      const cb =
        typeof chunk === 'function'
          ? chunk
          : typeof encodingOrCb === 'function'
            ? encodingOrCb
            : maybeCb;
      statusCode = res.statusCode;
      ended = true;
      res.writableEnded = true;
      res.finished = true;
      res.headersSent = true;
      if (typeof cb === 'function') {
        (cb as (err?: Error | null) => void)();
      }
      resolveDone();
      return res;
    },
    on() {
      return res;
    },
    once() {
      return res;
    },
    emit() {
      return false;
    },
    addListener() {
      return res;
    },
    removeListener() {
      return res;
    },
    off() {
      return res;
    },
    destroy() {
      return res;
    },
    cork() {},
    uncork() {},
    flushHeaders() {
      res.headersSent = true;
    },
  };

  await new Promise<void>((resolve, reject) => {
    try {
      app(
        req as unknown as Parameters<Application>[0],
        res as unknown as Parameters<Application>[1],
        (error?: unknown) => {
        if (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
          return;
        }
        if (ended) {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
      return;
    }

    void done.then(resolve);
    setTimeout(() => {
      if (!ended) {
        logger.warn('serverless.response_timeout', { path: options.expressPath });
        resolve();
      }
    }, 55_000).unref?.();
  });

  const headers = new Headers();
  for (const [key, value] of responseHeaders.entries()) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, String(item));
      }
    } else {
      headers.set(key, String(value));
    }
  }

  return new Response(method === 'HEAD' ? null : Buffer.concat(bodyChunks), {
    status: statusCode,
    headers,
  });
}
