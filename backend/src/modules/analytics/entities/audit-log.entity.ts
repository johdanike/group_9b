import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'actor_id' })
  actorId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'uuid', name: 'target_id', nullable: true })
  targetId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 50 })
  source: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'actor_id' })
  actor: any;
}
