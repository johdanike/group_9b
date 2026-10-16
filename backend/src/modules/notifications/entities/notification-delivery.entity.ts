import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

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

  @Column({ type: 'varchar', length: 50, name: 'delivery_state', default: 'pending' })
  deliveryState: string;

  @Column({ type: 'jsonb', name: 'timestamps', nullable: true })
  timestamps: any;

  @Column({ type: 'jsonb', name: 'cost_metadata', nullable: true })
  costMetadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('User')
  @JoinColumn({ name: 'recipient' })
  recipient: any;

  @ManyToOne('Incident', 'notificationDeliveries')
  @JoinColumn({ name: 'incident_id_or_sos_id' })
  incident: any;

  @ManyToOne('SOSRequest', 'notificationDeliveries')
  @JoinColumn({ name: 'incident_id_or_sos_id' })
  sosRequest: any;
}