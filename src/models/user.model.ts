import {
  Column, Entity, Index, PrimaryGeneratedColumn,
} from 'typeorm';
import {
  IsBoolean, IsEmail, IsString, Length,
} from 'class-validator';

@Entity()
export default class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index({ unique: true })
  @IsString()
  @Length(2, 20)
  username!: string;

  @Column({ select: false })
  @IsString()
  password!: string;

  @Column()
  @IsBoolean()
  admin!: boolean;

  @Column()
  @Index({ unique: true })
  @IsEmail()
  email!: string;

  ordercount!: number;
}
