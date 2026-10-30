import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'reporter_id' })
  reporterId: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamptz', name: 'observed_at' })
  observedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'submitted_at' })
  submittedAt: Date;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'coordinates_or_area',
  })
  coordinatesOrArea: { type: 'Point'; coordinates: [number, number] };

  @Column({ type: 'varchar', length: 50, name: 'location_precision' })
  locationPrecision: string;

  @Column({ type: 'varchar', length: 50, default: 'unverified' })
  state: string;

  @Column({ type: 'jsonb', name: 'evidence_references', nullable: true })
  evidenceReferences: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'int', name: 'confirmations_count', default: 0 })
  confirmationsCount: number;

  @Column({ type: 'int', name: 'disputes_count', default: 0 })
  disputesCount: number;

  @ManyToOne('User', 'reports')
  @JoinColumn({ name: 'reporter_id' })
  reporter: any;

  @OneToMany('EvidenceAsset', 'report')
  evidenceAssets: any[];

  @OneToMany('IncidentReportLink', 'report')
  incidentLinks: any[];
}
