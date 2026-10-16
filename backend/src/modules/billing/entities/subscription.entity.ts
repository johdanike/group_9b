import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'organisation_or_community_id' })
  organisationOrCommunityId: string;

  @Column({ type: 'varchar', length: 50 })
  plan: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', name: 'renewal_date' })
  renewalDate: Date;

  @Column({ type: 'varchar', length: 100, name: 'billing_reference', nullable: true })
  billingReference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('Community', 'subscriptions')
  @JoinColumn({ name: 'organisation_or_community_id' })
  organisationOrCommunity: any;
}