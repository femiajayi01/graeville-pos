import { hashPassword, verifyPassword } from './password.util';

describe('password.util', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('accepts bcrypt hashes created by Laravel ($2y$ prefix)', async () => {
    // bcrypt('secret') produced by PHP password_hash()
    const laravelHash =
      '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm';
    expect(await verifyPassword('secret', laravelHash)).toBe(true);
  });
});
