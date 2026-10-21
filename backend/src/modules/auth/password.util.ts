import * as bcrypt from 'bcryptjs';

const ROUNDS = 10;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, ROUNDS);

/**
 * Verifies a password. Laravel/PHP writes bcrypt hashes with the `$2y$` prefix;
 * they are byte-for-byte compatible with `$2a$`/`$2b$`, so passwords migrated
 * from the old database keep working.
 */
export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash.replace(/^\$2y\$/, '$2b$'));
