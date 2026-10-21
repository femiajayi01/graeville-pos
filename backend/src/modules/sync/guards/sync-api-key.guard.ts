import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { AppRequest } from '../../../common/interfaces/app-request.interface';

export const SYNC_KEY_HEADER = 'x-sync-key';

/**
 * Protects the server-to-server sync endpoints with a shared secret.
 * (The Laravel api/v1 sync routes had no authentication at all.)
 */
@Injectable()
export class SyncApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('sync.apiKey') ?? '';
    if (!expected)
      throw new ServiceUnavailableException(
        'Sync is not configured on this server (SYNC_API_KEY)',
      );

    const provided = String(
      context.switchToHttp().getRequest<AppRequest>().headers[
        SYNC_KEY_HEADER
      ] ?? '',
    );
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new UnauthorizedException('Invalid sync key');
    return true;
  }
}
