import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('notification_deliveries')
export class NotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'incident_id_or_sos_id', nullable: true })
  incidentIdOrSosId: string;

  @Column({ type: 'uuid', name: 'recipient' })
  recipientId: string;

  @Column({ type: 'varchar', length: 50 })
  channel: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'int', default: 1 })
  attempt: number;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'delivery_state',
    default: 'pending',
  })
  deliveryState: string;

  @Column({ type: 'jsonb', name: 'timestamps', nullable: true })
  timestamps: any;

  @Column({ type: 'jsonb', name: 'cost_metadata', nullable: true })
  costMetadata: any;

  @Column({ type: 'jsonb', nullable: true })
  payload: { title: string; body: string; reportId: string };

  @Column({ type: 'varchar', name: 'push_state', default: 'none' })
  pushState: string;

  @Column({ type: 'int', name: 'push_attempts', default: 0 })
  pushAttempts: number;

  @Column({ type: 'timestamptz', name: 'push_next_attempt_at', nullable: true })
  pushNextAttemptAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne('User')
  @JoinColumn({ name: 'recipient' })
  recipient: any;

  @ManyToOne('Incident', 'notificationDeliveries', {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'incident_id_or_sos_id' })
  incident: any;

  @ManyToOne('SOSRequest', 'notificationDeliveries', {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'incident_id_or_sos_id' })
  sosRequest: any;
}
