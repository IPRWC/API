import * as argon2 from 'argon2';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import User from '../models/user/user.model';
import app from '../index';
import Cart from '../models/cart/cart.model';

export async function getAll(): Promise<User[]> {
  return app.db.getRepository(User)
    .createQueryBuilder('user')
    .select(['user.username', 'user.admin', 'user.email'])
    .getMany();
}

export async function get(username: string): Promise<User> {
  return app.db.getRepository(User)
    .createQueryBuilder('user')
    .select(['user.id', 'user.username', 'user.admin', 'user.email'])
    .where('user.username = :username', { username })
    .getOneOrFail();
}

export async function getById(id: string): Promise<User> {
  return app.db.getRepository(User)
    .createQueryBuilder('user')
    .select(['user.username', 'user.admin', 'user.email'])
    .where('user.id = :id', { id })
    .getOneOrFail();
}

export async function create(body: any): Promise<void> {
  const newBody = body;
  if (newBody.id) delete newBody.id;
  if (newBody.orders) delete newBody.orders;
  if (newBody.cart) delete newBody.cart;
  const user = plainToClass(User, body);
  user.password = await argon2.hash(user.password);
  await validateOrReject(user);
  const cart = new Cart();
  await app.db.manager.save(cart);
  user.cart = cart;
  await app.db.getRepository(User)
    .save(user);
}

export async function login(username: string): Promise<User | undefined> {
  return app.db.getRepository(User)
    .createQueryBuilder('user')
    .select(['user.id', 'user.password'])
    .where('user.username = :username', { username })
    .getOne();
}

export async function remove(username: string): Promise<void> {
  const user = await app.db.getRepository(User)
    .createQueryBuilder('user')
    .where('user.username = :username', { username })
    .getOne();
  if (!user) throw new Error('Could not find user');
  await app.db.getRepository(User).remove(user);
}
