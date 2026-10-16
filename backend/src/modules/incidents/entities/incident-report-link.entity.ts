import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('incident_report_links')
export class IncidentReportLink {
  @PrimaryColumn({ type: 'uuid', name: 'incident_id' })
  incidentId: string;

  @PrimaryColumn({ type: 'uuid', name: 'report_id' })
  reportId: string;

  @Column({ type: 'varchar', length: 50, name: 'link_type' })
  linkType: string;

  @Column({ type: 'uuid', name: 'linked_by' })
  linkedBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'linked_at' })
  linkedAt: Date;

  @ManyToOne('Incident', 'reportLinks')
  @JoinColumn({ name: 'incident_id' })
  incident: any;

  @ManyToOne('Report', 'incidentLinks')
  @JoinColumn({ name: 'report_id' })
  report: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'linked_by' })
  linker: any;
}
