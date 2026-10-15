import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'canonical_category' })
  canonicalCategory: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'canonical_location',
  })
  canonicalLocation: string;

  @CreateDateColumn({ name: 'first_seen_at' })
  firstSeenAt: Date;

  @UpdateDateColumn({ name: 'last_updated_at' })
  lastUpdatedAt: Date;

  @Column({ type: 'varchar', length: 50, default: 'Open' })
  status: string;

  @Column({ type: 'varchar', length: 50, name: 'verification_state', default: 'Unverified' })
  verificationState: string;

  @Column({ type: 'varchar', length: 20, default: 'Medium' })
  severity: string;

  @OneToMany('IncidentReportLink', 'incident')
  reportLinks: any[];

  @OneToMany('NotificationDelivery', 'incident')
  notificationDeliveries: any[];
}