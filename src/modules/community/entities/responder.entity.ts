import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('responders')
export class Responder {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'community_id' })
  communityId: string;

  @Column({ type: 'jsonb', name: 'qualifications_or_role_claims', nullable: true })
  qualificationsOrRoleClaims: any;

  @Column({ type: 'jsonb', name: 'availability_window', nullable: true })
  availabilityWindow: any;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    name: 'coverage_area',
    nullable: true,
  })
  coverageArea: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @ManyToOne('User', 'responderProfiles')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Community', 'responders')
  @JoinColumn({ name: 'community_id' })
  community: any;
}