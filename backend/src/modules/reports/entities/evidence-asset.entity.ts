import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('evidence_assets')
export class EvidenceAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'report_id' })
  reportId: string;

  @Column({ type: 'varchar', length: 500, name: 'storage_key' })
  storageKey: string;

  @Column({ type: 'jsonb', name: 'media_metadata', nullable: true })
  mediaMetadata: any;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'moderation_state',
    default: 'pending',
  })
  moderationState: string;

  @Column({ type: 'timestamptz', name: 'retention_deadline', nullable: true })
  retentionDeadline: Date;

  @ManyToOne('Report')
  @JoinColumn({ name: 'report_id' })
  report: any;
}
