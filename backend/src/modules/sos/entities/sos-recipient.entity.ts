import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('sos_recipients')
export class SOSRecipient {
  @PrimaryColumn({ type: 'uuid', name: 'sos_id' })
  sosId: string;

  @PrimaryColumn({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'varchar', length: 50 })
  channel: string;

  @Column({ type: 'varchar', length: 50, name: 'delivery_state', default: 'pending' })
  deliveryState: string;

  @Column({ type: 'varchar', length: 50, name: 'acknowledgement_state', default: 'unacknowledged' })
  acknowledgementState: string;

  @Column({ type: 'jsonb', name: 'timestamps', nullable: true })
  timestamps: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('SOSRequest', 'recipients')
  @JoinColumn({ name: 'sos_id' })
  sosRequest: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'recipient_id' })
  recipient: any;
}