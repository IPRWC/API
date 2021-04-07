import cors from 'cors';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import Server from './server';
import UserController from './controllers/user.controller';
import 'reflect-metadata';
import User from './models/user/user.model';
import AuthController from './controllers/auth.controller';
import ProductController from './controllers/product.controller';
import OrderController from './controllers/order.controller';
import CartController from './controllers/cart.controller';

declare global {
  namespace Express {
    interface Request {
      user: User
    }
  }
}

const app = new Server({
  port: 5500,
  controllers: [
    new UserController(),
    new AuthController(),
    new ProductController(),
    new OrderController(),
    new CartController(),
  ],
  middleWares: [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    cors(),
    helmet(),
  ],
});

app.listen();

export default app;
