import 'dotenv/config';
import { DataSource } from 'typeorm';
import { USER_ROLES } from '../enums/user-role.enum';
import { User } from '../users/user.entity';
import { hashPassword } from '../users/password.util';
import { getDatabaseOptions } from './database.config';
import './patch-pg-client-query';

const SUPER_ADMIN_ROLE = USER_ROLES[0];

function getSeedEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

async function main() {
  const email = getSeedEnv('SUPER_ADMIN_EMAIL').toLowerCase();
  const password = getSeedEnv('SUPER_ADMIN_PASSWORD');
  const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';
  const database = new DataSource({
    ...getDatabaseOptions(),
    entities: [User],
  });

  await database.initialize();

  try {
    const usersRepository = database.getRepository(User);
    const existingUser = await usersRepository
      .createQueryBuilder('user')
      .where('LOWER(TRIM(user.email)) = :email', { email })
      .getOne();

    const passwordHash = await hashPassword(password);

    if (existingUser) {
      existingUser.name = name;
      existingUser.email = email;
      existingUser.password = passwordHash;
      existingUser.role = SUPER_ADMIN_ROLE;
      existingUser.createdById = null;
      await usersRepository.save(existingUser);

      console.log(`Updated super admin: ${email}`);
      return;
    }

    await usersRepository.save(
      usersRepository.create({
        name,
        email,
        password: passwordHash,
        role: SUPER_ADMIN_ROLE,
        organizationId: null,
        organizationName: null,
        createdById: null,
      }),
    );

    console.log(`Created super admin: ${email}`);
  } finally {
    await database.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error('Failed to seed super admin.', error);
  process.exitCode = 1;
});
