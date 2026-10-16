import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('web_push_devices')
export class WebPushDevice {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'uuid', name: 'user_id' }) userId: string;
  @Index({ unique: true }) @Column({ type: 'text' }) endpoint: string;
  @Column({ type: 'jsonb' }) keys: { auth: string; p256dh: string };
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: unknown;
}
