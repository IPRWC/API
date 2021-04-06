import cors from 'cors';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import Server from './server';
import UserController from './controllers/user.controller';
import 'reflect-metadata';
import User from './models/user.model';
import AuthController from './controllers/auth.controller';

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
