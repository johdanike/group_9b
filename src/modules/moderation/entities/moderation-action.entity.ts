import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('moderation_actions')
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'actor_id' })
  actorId: string;

  @Column({ type: 'uuid', name: 'target_id' })
  targetId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 20, name: 'appeal_status', default: 'none' })
  appealStatus: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'actor_id' })
  actor: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'target_id' })
  target: any;
}