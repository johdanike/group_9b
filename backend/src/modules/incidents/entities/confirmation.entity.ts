import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('confirmations')
export class Confirmation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'report_id_or_incident_id' })
  reportIdOrIncidentId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'boolean', name: 'firsthand_flag', default: false })
  firsthandFlag: boolean;

  @Column({ type: 'varchar', length: 20, name: 'confirmation_or_dispute' })
  confirmationOrDispute: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('User', 'confirmations')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Report')
  @JoinColumn({ name: 'report_id_or_incident_id' })
  report: any;

  @ManyToOne('Incident')
  @JoinColumn({ name: 'report_id_or_incident_id' })
  incident: any;
}