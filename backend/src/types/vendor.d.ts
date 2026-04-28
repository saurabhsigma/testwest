declare namespace Express {
  interface Request {
    body: any;
    params: Record<string, string>;
    query: Record<string, string | string[] | undefined>;
    headers: Record<string, string | undefined> & {
      authorization?: string;
    };
    originalUrl?: string;
    user?: any;
    validated?: {
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      query?: Record<string, string[]>;
    };
  }
}

declare module "express" {
  export interface Request extends Express.Request {}

  export interface Response {
    statusCode?: number;
    status(code: number): Response;
    json(body: unknown): Response;
    send(body: unknown): Response;
    end(): Response;
  }

  export type NextFunction = (err?: unknown) => void;
  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => unknown;

  export interface Router {
    use(...handlers: unknown[]): Router;
    get(path: string, ...handlers: RequestHandler[]): Router;
    post(path: string, ...handlers: RequestHandler[]): Router;
    put(path: string, ...handlers: RequestHandler[]): Router;
    patch(path: string, ...handlers: RequestHandler[]): Router;
    delete(path: string, ...handlers: RequestHandler[]): Router;
  }

  export interface Application extends Router {
    listen(port: number, callback?: () => void): unknown;
  }

  export function Router(): Router;

  function express(): Application;

  namespace express {
    function json(options?: { limit?: string | number }): RequestHandler;
  }

  export default express;
}

declare module "cors" {
  const cors: (...args: unknown[]) => unknown;
  export default cors;
}

declare module "morgan" {
  const morgan: (...args: unknown[]) => unknown;
  export default morgan;
}

declare module "jsonwebtoken" {
  const jwt: {
    sign: (...args: unknown[]) => string;
    verify: (...args: unknown[]) => unknown;
    decode: (...args: unknown[]) => unknown;
  };

  export default jwt;
  export const sign: typeof jwt.sign;
  export const verify: typeof jwt.verify;
  export const decode: typeof jwt.decode;
}

declare module "express-rate-limit" {
  const rateLimit: (...args: unknown[]) => unknown;
  export default rateLimit;
}

declare module "helmet" {
  const helmet: (...args: unknown[]) => unknown;
  export default helmet;
}
