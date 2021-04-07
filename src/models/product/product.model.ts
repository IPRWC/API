import {
  Column, Entity, Index, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import {
  IsBoolean, IsNumber, IsOptional, IsString, IsUrl, Min,
} from 'class-validator';
import OrderBatch from '../order/order-batch.model';

@Entity()
export default class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index({ unique: true })
  @IsString()
  name!: string;

  @Column({ type: 'text' })
  @IsString()
  description!: string;

  @Column({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  deleted!: boolean;

  @Column('float')
  @IsNumber()
  @Min(0)
  price!: number;

  @Column()
  @IsUrl()
  image!: string;

  @OneToMany(() => OrderBatch, (orderBatch) => orderBatch.product)
  orders!: Product[];
}
