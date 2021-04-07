import app from '../index';
import User from '../models/user/user.model';
import Order from '../models/order/order.model';
import OrderBatch from '../models/order/order-batch.model';
import Product from '../models/product/product.model';

async function getProduct(id: string) {
  return app.db.getRepository(Product)
    .createQueryBuilder('product')
    .where('product.id = :id', { id })
    .getOneOrFail();
}

export async function getAll(): Promise<Order[]> {
  return app.db.getRepository(Order)
    .createQueryBuilder('order')
    .leftJoinAndSelect('order.products', 'orderProduct')
    .leftJoinAndSelect('orderProduct.product', 'product')
    .leftJoinAndSelect('order.user', 'user')
    .getMany();
}

export async function getAllForUser(user: User): Promise<Order[]> {
  return app.db.getRepository(Order)
    .createQueryBuilder('order')
    .where('order.user = :userId', { userId: user.id })
    .leftJoinAndSelect('order.products', 'orderProduct')
    .leftJoinAndSelect('orderProduct.product', 'product')
    .leftJoinAndSelect('order.user', 'user')
    .getMany();
}

export async function getOrder(user: User, orderId: string): Promise<Order> {
  return app.db.getRepository(Order)
    .createQueryBuilder('order')
    .where('order.user = :userId', { userId: user.id })
    .andWhere('order.id = :orderId', { orderId })
    .leftJoinAndSelect('order.products', 'orderProduct')
    .leftJoinAndSelect('orderProduct.product', 'product')
    .getOneOrFail();
}

export async function create(user: User, totalPrice: number): Promise<Order> {
  const order = new Order();
  order.orderDate = new Date();
  order.totalPrice = totalPrice;
  await app.db.manager.save(order);

  await app.db.getRepository(User)
    .createQueryBuilder()
    .relation(User, 'orders')
    .of(user)
    .add(order);

  return order;
}

export async function addBatchToOrder(user: User, order: Order, batches: any) {
  /* eslint no-await-in-loop: "off" */
  for (const batch of batches) {
    const orderBatch = new OrderBatch();
    orderBatch.quantity = batch.quantity;
    orderBatch.product = await getProduct(batch.product);
    await app.db.manager.save(orderBatch);

    await app.db.getRepository(Order)
      .createQueryBuilder()
      .relation(Order, 'products')
      .of(order)
      .add(orderBatch);
  }
}
