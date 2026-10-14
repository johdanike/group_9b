import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';

@Entity('user_location_preferences')
export class UserLocationPreference {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    name: 'selected_area',
    nullable: true,
  })
  selectedArea: string;

  @Column({ type: 'float', nullable: true })
  radius: number;

  @Column({ type: 'varchar', length: 20, name: 'permission_state', default: 'denied' })
  permissionState: string;

  @Column({ type: 'varchar', length: 50, name: 'retention_preference', default: 'default' })
  retentionPreference: string;

  // Inverse side is defined in User entity
  // No decorator needed here for the relationship
}