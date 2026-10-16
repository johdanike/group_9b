import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('notification_subscriptions')
export class NotificationSubscription {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @PrimaryColumn({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'float', default: 6.5244 })
  latitude: number;

  @Column({ type: 'float', default: 3.3792 })
  longitude: number;

  @Column({ type: 'float', name: 'area_or_radius' })
  areaOrRadius: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'priority_threshold',
    default: 'normal',
  })
  priorityThreshold: string;

  @Column({ type: 'jsonb', name: 'quiet_hours', nullable: true })
  quietHours: any;

  @ManyToOne('User', 'notificationSubscriptions')
  @JoinColumn({ name: 'user_id' })
  user: any;
}
