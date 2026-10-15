import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { UserRole, AccountStatus } from '../interfaces/identity.interface.js';

@Entity('users')
@Index(['phone'], { unique: true })
@Index(['accountStatus'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName: string;

  @Column({ type: 'varchar', length: 20, name: 'account_status', default: AccountStatus.PENDING_VERIFICATION })
  accountStatus: AccountStatus;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.RESIDENT })
  role: UserRole;

  @Column({ type: 'uuid', name: 'community_id', nullable: true })
  communityId: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'jsonb', name: 'privacy_settings', nullable: true })
  privacySettings: any;

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata: any;

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