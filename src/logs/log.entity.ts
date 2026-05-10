import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
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
  userId: number | null;

  @Column({ type: 'integer', nullable: true })
  organizationId: number | null;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
