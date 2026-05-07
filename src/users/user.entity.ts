import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ type: 'varchar', nullable: true })
  role: UserRole | null;

  @Column({ type: 'integer', nullable: true })
  organizationId: number | null;
}
