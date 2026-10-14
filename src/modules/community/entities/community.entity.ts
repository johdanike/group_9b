import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('communities')
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    name: 'boundary',
  })
  boundary: string;

  @Column({ type: 'uuid', name: 'admin_id' })
  adminId: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'standard' })
  plan: string;

  @Column({ type: 'jsonb', name: 'responder_coverage_configuration', nullable: true })
  responderCoverageConfiguration: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('User')
  @JoinColumn({ name: 'admin_id' })
  admin: any;

  @OneToMany('Responder', 'community')
  responders: any[];

  @OneToMany('Subscription', 'organisationOrCommunity')
  subscriptions: any[];
}