import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { hashPassword } from '../../modules/auth/password.util';
import { User } from '../../modules/users/user.entity';
import dataSource from '../data-source';

/**
 * Creates the first Super Admin (Laravel: database/seeds/UserTableSeeder.php).
 * Safe to run more than once — an existing account is left untouched.
 */
async function run() {
  const logger = new Logger('Seed');
  await dataSource.initialize();
  try {
    const repo = dataSource.getRepository(User);
    const email = (
      process.env.SEED_ADMIN_EMAIL ?? 'admin@graeville.com'
    ).toLowerCase();

    if (await repo.existsBy({ email })) {
      logger.log(`Super Admin ${email} already exists — nothing to do.`);
      return;
    }
    await repo.save(
      repo.create({
        email,
        firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin',
        lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'User',
        password: await hashPassword(
          process.env.SEED_ADMIN_PASSWORD ?? 'password1!',
        ),
        role: Role.SUPER_ADMIN,
        registeredBy: 'seed',
        synced: false,
      }),
    );
    logger.log(`Created Super Admin ${email}`);
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
