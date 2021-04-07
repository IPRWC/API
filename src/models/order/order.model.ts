import {
  Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import { IsDate, Min } from 'class-validator';
import User from '../user/user.model';
import OrderBatch from './order-batch.model';

@Entity()
export default class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.orders)
  user!: string;

  @OneToMany(() => OrderBatch, (orderBatch) => orderBatch.order)
  products!: OrderBatch[];

  @Column()
  @IsDate()
  orderDate!: Date;

  @Column('float')
  @Min(0)
  totalPrice!: number;
}
