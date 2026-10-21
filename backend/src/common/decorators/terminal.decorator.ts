import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { hostname } from 'os';
import { AppRequest } from '../interfaces/app-request.interface';

export const TERMINAL_HEADER = 'x-terminal-id';

/**
 * Identifies the till/computer a request comes from.
 * The Laravel app used PHP `gethostname()` (one server per till). In a browser app
 * several tills can share one API, so the Angular app sends an `X-Terminal-Id` header;
 * when it is missing we fall back to the server hostname to keep the old behaviour.
 */
export const Terminal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const header = ctx.switchToHttp().getRequest<AppRequest>().headers[
      TERMINAL_HEADER
    ];
    const value = Array.isArray(header) ? header[0] : header;
    return (value && String(value).trim().slice(0, 100)) || hostname();
  },
);
