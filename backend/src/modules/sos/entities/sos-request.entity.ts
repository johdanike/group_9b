import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('sos_requests')
export class SOSRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'requester_id' })
  requesterId: string;

  @Column({ type: 'varchar', length: 100, name: 'incident_type' })
  incidentType: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'location_snapshot',
  })
  locationSnapshot: string;

  @Column({ type: 'jsonb', name: 'sharing_policy', nullable: true })
  sharingPolicy: any;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  state: string;

  @Column({ type: 'jsonb', name: 'escalation_policy', nullable: true })
  escalationPolicy: any;

  @ManyToOne('User', 'sosRequests')
  @JoinColumn({ name: 'requester_id' })
  requester: any;

  @OneToMany('SOSRecipient', 'sosRequest')
  recipients: any[];

  @OneToMany('NotificationDelivery', 'sosRequest')
  notificationDeliveries: any[];
}
