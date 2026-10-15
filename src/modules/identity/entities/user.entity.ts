import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName: string;

  @Column({ type: 'varchar', length: 20, name: 'account_status', default: 'active' })
  accountStatus: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'jsonb', name: 'privacy_settings', nullable: true })
  privacySettings: any;

  @OneToOne('UserLocationPreference', { cascade: true })
  @JoinColumn({ name: 'id' })
  locationPreference: any;

  @OneToMany('Report', 'reporter')
  reports: any[];

  @OneToMany('NotificationSubscription', 'user')
  notificationSubscriptions: any[];

  @OneToMany('SOSRequest', 'requester')
  sosRequests: any[];

  @OneToMany('Confirmation', 'user')
  confirmations: any[];

  @OneToMany('Responder', 'user')
  responderProfiles: any[];
}