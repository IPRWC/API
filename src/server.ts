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

  public limiterSlowBruteByIP!: RateLimiterMySQL;

  public limiterConsecutiveFailsByUsernameAndIP!: RateLimiterMySQL;

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

    this.limiterSlowBruteByIP = new RateLimiterMySQL({
      storeClient: pool,
      keyPrefix: 'login_fail_ip_per_day',
      points: maxWrongAttemptsByIPPerDay,
      duration: 60 * 60 * 24,
      blockDuration: 60 * 60 * 24, // Block for 1 day, if 100 wrong attempts per day
    });

    this.limiterConsecutiveFailsByUsernameAndIP = new RateLimiterMySQL({
      storeClient: pool,
      keyPrefix: 'login_fail_consecutive_username_and_ip',
      points: maxConsecutiveFailsByUsernameAndIP,
      duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
      blockDuration: 60 * 60, // Block for 1 hour
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
