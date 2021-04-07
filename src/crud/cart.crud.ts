import app from '../index';
import User from '../models/user/user.model';
import Cart from '../models/cart/cart.model';
import CartBatch from '../models/cart/cart-batch.model';
import Product from '../models/product/product.model';

async function getProduct(id: string) {
  return app.db.getRepository(Product)
    .createQueryBuilder('product')
    .where('product.id = :id', { id })
    .getOneOrFail();
}

export async function getCart(user: User): Promise<Cart> {
  return app.db.getRepository(Cart)
    .createQueryBuilder('cart')
    .leftJoin('cart.user', user.id)
    .leftJoinAndSelect('cart.products', 'batch')
    .leftJoinAndSelect('batch.product', 'product')
    .getOneOrFail();
}

export async function addBatches(user: User, batches: any) {
  const cart = await app.db.getRepository(Cart)
    .createQueryBuilder('cart')
    .leftJoin('cart.user', user.id)
    .getOneOrFail();

  const oldCartProducts = await app.db.getRepository(CartBatch)
    .createQueryBuilder('cartProduct')
    .where('cartProduct.cart = :cartId', { cartId: cart.id })
    .getMany();

  await app.db.getRepository(CartBatch).remove(oldCartProducts);

  /* eslint no-await-in-loop: "off" */
  for (const batch of batches) {
    const cartBatch = new CartBatch();
    cartBatch.quantity = batch.quantity;
    cartBatch.product = await getProduct(batch.product);
    await app.db.manager.save(cartBatch);

    await app.db.getRepository(Cart)
      .createQueryBuilder()
      .relation(Cart, 'products')
      .of(cart)
      .add(cartBatch);
  }
}
