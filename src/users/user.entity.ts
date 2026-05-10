import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { UserRole } from '../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
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

  @Column({ type: 'varchar', nullable: true })
  organizationName: string | null;

  @Column({ type: 'integer', nullable: true })
  createdById: number | null;
}
