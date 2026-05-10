import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CustomerStatus } from '../common/enums/customer-status.enum';
import { User } from '../users/user.entity';
import type { CustomerNote } from '../types/customers/customer.types';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'integer', nullable: true })
  organizationId: number | null;

  @Column({ type: 'integer', nullable: true })
  createdById: number | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  notes: CustomerNote[];

  @Column({ type: 'varchar', default: 'active' })
  status: CustomerStatus;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'assignedTo' })
  assignedTo: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
