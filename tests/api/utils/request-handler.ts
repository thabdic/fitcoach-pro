import { APIRequestContext, expect } from '@playwright/test';

/**
 * Every FitCoach endpoint answers with the same envelope (api-response.ts):
 *   success: { success: true, data: <named key> }
 *   error:   { success: false, message }
 *   422:     { success: false, message: 'Validation failed', errors: [{ field, message }] }
 */
export interface ApiEnvelope {
  success: boolean;
  data?: any;
  message?: string;
  errors?: { field: string; message: string }[];
}

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Fluent wrapper around Playwright's APIRequestContext, so a test reads as one
 * sentence instead of five lines of plumbing:
 *
 *   const res = await api.path('/workout-plans').token(trainerToken).getRequest(200);
 *
 * The expected status code is asserted inside the terminal call, and the parsed
 * envelope comes back — so tests assert on payloads, not on transport.
 */
export class RequestHandler {
  private request: APIRequestContext;
  private defaultBaseUrl: string;
  private baseUrl = '';
  private apiPath = '';
  private queryParams: Record<string, string | number> = {};
  private apiHeaders: Record<string, string> = {};
  private apiBody: object = {};

  constructor(request: APIRequestContext, apiBaseUrl: string) {
    this.request = request;
    this.defaultBaseUrl = apiBaseUrl;
  }

  /** Override the base URL for one call (default comes from BACKEND_URL). */
  url(url: string): this {
    this.baseUrl = url;
    return this;
  }

  path(path: string): this {
    this.apiPath = path;
    return this;
  }

  params(params: Record<string, string | number>): this {
    this.queryParams = params;
    return this;
  }

  /** Merges rather than replaces, so .token() and .headers() can be combined. */
  headers(headers: Record<string, string>): this {
    this.apiHeaders = { ...this.apiHeaders, ...headers };
    return this;
  }

  /** Shorthand for the Bearer header — the only auth this API uses. */
  token(token: string): this {
    return this.headers({ Authorization: `Bearer ${token}` });
  }

  body(body: object): this {
    this.apiBody = body;
    return this;
  }

  async getRequest(statusCode: number): Promise<ApiEnvelope> {
    return this.send('get', statusCode);
  }

  async postRequest(statusCode: number): Promise<ApiEnvelope> {
    return this.send('post', statusCode);
  }

  async putRequest(statusCode: number): Promise<ApiEnvelope> {
    return this.send('put', statusCode);
  }

  /** PATCH carries the role/status/assign updates — /users/:id/role, /plan-requests/:id/status. */
  async patchRequest(statusCode: number): Promise<ApiEnvelope> {
    return this.send('patch', statusCode);
  }

  /** DELETE still answers with a body here: { message, id }. */
  async deleteRequest(statusCode: number): Promise<ApiEnvelope> {
    return this.send('delete', statusCode);
  }

  private getUrl(): string {
    const url = new URL(`${this.baseUrl || this.defaultBaseUrl}${this.apiPath}`);
    for (const [key, value] of Object.entries(this.queryParams)) {
      url.searchParams.append(key, String(value));
    }
    return url.toString();
  }

  /**
   * Cleared after every call so a second request on the same handler cannot
   * inherit the first one's body, token or query params. Tests routinely make
   * several calls in a row, and a leaked body is a confusing way to fail.
   */
  private reset(): void {
    this.baseUrl = '';
    this.apiPath = '';
    this.queryParams = {};
    this.apiHeaders = {};
    this.apiBody = {};
  }

  private async send(method: HttpMethod, expectedStatus: number): Promise<ApiEnvelope> {
    const url = this.getUrl();
    const options: { headers: Record<string, string>; data?: object } = { headers: this.apiHeaders };
    if (method === 'post' || method === 'put' || method === 'patch') {
      options.data = this.apiBody;
    }
    this.reset();

    const response = await this.request[method](url, options);
    // The body is in the failure message: a bare "expected 200, got 422" tells
    // you nothing, while the envelope names the field that failed validation.
    expect(response.status(), `${method.toUpperCase()} ${url} -> ${await response.text()}`).toEqual(expectedStatus);
    return response.json();
  }
}
