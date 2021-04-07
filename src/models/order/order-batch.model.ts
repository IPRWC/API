import {
  Column, Entity, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { IsNumber, Min } from 'class-validator';
import Order from './order.model';
import Product from '../product/product.model';

@Entity()
export default class OrderBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ManyToOne(() => Product, (product) => product.orders)
  product!: Product;

  @ManyToOne(() => Order, (order) => order.products)
  order!: Order;
}
