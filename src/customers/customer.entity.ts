import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

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

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'assignedTo' })
  assignedTo: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
