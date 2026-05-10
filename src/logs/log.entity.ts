import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column({ type: 'integer', nullable: true })
  actorId: number | null;

  @Column({ type: 'integer', nullable: true })
  createdById: number | null;

  @Column({ nullable: false })
  createdByName: string;

  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', nullable: true })
  userName: string | null;

  @Column({ type: 'integer', nullable: true })
  organizationId: number | null;

  @Column({ type: 'varchar', nullable: true })
  organizationName: string | null;

  @Column({ type: 'varchar', nullable: true })
  details: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
