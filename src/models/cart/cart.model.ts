import {
  Entity, OneToMany, OneToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import User from '../user/user.model';
import CartBatch from './cart-batch.model';

@Entity()
export default class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => CartBatch, (cartBatch) => cartBatch.cart)
  products!: CartBatch[];

  @OneToOne(() => User, (user) => user.cart)
  user!: User;
}
