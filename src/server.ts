import express, { Application } from 'express';
import { Connection } from 'typeorm';
import { RateLimiterMySQL } from 'rate-limiter-flexible';
import { MysqlDriver } from 'typeorm/driver/mysql/MysqlDriver';
import Database from './structures/database.structures';
import {
  dbName, maxConsecutiveFailsByUsernameAndIP, maxWrongAttemptsByIPPerDay,
} from './config';

class Server {
  public app: Application;

  public db!: Connection;

  public port: number;

  public IPLimiter!: RateLimiterMySQL;

  public FailsByUsernameAndIP!: RateLimiterMySQL;

  constructor(appInit: { port: number; middleWares: any; controllers: any; }) {
    this.app = express();
    this.port = appInit.port;
    this.init(appInit.middleWares, appInit.controllers);
  }

  private async init(middleWares: any, controllers: any): Promise<void> {
    this.middlewares(middleWares);
    this.routes(controllers);

    this.db = Database.get(dbName);
    await this.db.connect();
    await this.db.synchronize();

    const { pool } = this.db.driver as MysqlDriver;

    this.IPLimiter = new RateLimiterMySQL({
      storeClient: pool,
      keyPrefix: 'login_fail_ip_per_day',
      points: maxWrongAttemptsByIPPerDay,
      duration: 60 * 60,
      blockDuration: 60 * 60,
    });

    this.FailsByUsernameAndIP = new RateLimiterMySQL({
      storeClient: pool,
      keyPrefix: 'login_fail_consecutive_username_and_ip',
      points: maxConsecutiveFailsByUsernameAndIP,
      duration: 60 * 60 * 24 * 30,
      blockDuration: 60 * 60,
    });
  }

  private middlewares(middleWares: { forEach: (arg0: (middleWare: any) => void) => void; }) {
    middleWares.forEach((middleWare) => {
      this.app.use(middleWare);
    });
  }

  private routes(controllers: { forEach: (arg0: (controller: any) => void) => void; }) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App listening on the http://localhost:${this.port}`);
    });
  }
}

export default Server;
