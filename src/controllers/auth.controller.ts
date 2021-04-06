import * as express from 'express';
import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import ControllerInterface from '../interfaces/controller.interface';

import {
  getLoginUser, getUser,
} from '../crud/user.crud';
import {
  expiresIn, maxConsecutiveFailsByUsernameAndIP, maxWrongAttemptsByIPPerDay, secret,
} from '../config';
import JwtPayloadInterface from '../interfaces/jwt-payload.interface';
import { authMiddleware } from '../middleware/auth.middleware';
import app from '../index';

class AuthController implements ControllerInterface {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get('/auth/me', authMiddleware, this.getMe);
    this.router.post('/auth/login', this.login);
  }

  getMe = async (req: Request, res: Response) => res.status(200).json(req.user);

  // eslint-disable-next-line consistent-return
  login = async (req: Request, res: Response) => {
    const userBody = req.body;
    if (typeof userBody.username !== 'string'
        || typeof userBody.password !== 'string') return res.status(400).json('Please specify a username and password');

    const ipAddr = req.ip;
    const usernameIPkey = `${req.body.username}_${ipAddr}`;
    const [resUsernameAndIP, resSlowByIP] = await Promise.all([
      app.limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
      app.limiterSlowBruteByIP.get(ipAddr),
    ]);

    let retrySecs = 0;

    // Check if IP or Username + IP is already blocked
    if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPPerDay) {
      retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
    } else if (resUsernameAndIP !== null
        && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
      retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
    }
    if (retrySecs > 0) {
      res.set('Retry-After', String(retrySecs));
      res.status(429).send('Too Many Requests');
    } else {
      const userInDB = await getLoginUser(userBody.username);
      if (userInDB && await argon2.verify(userInDB.password, userBody.password)) {
        if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
          // Reset on successful authorisation
          await app.limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
        }
        const payload: JwtPayloadInterface = {
          userId: userInDB.id,
        };

        jwt.sign(
          payload,
          secret,
          {
            expiresIn,
          } as SignOptions,
          async (err, token) => {
            if (err) throw err;
            const user = await getUser(userBody.username);
            res.status(200).json({
              expiresIn,
              token,
              user,
            });
          },
        );
      } else {
        // Consume 1 point from limiters on wrong attempt and block if limits reached
        try {
          const promises = [app.limiterSlowBruteByIP.consume(ipAddr)];
          if (userInDB) {
            // Count failed attempts by Username + IP only for registered users
            promises.push(app.limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey));
          }
          await Promise.all(promises);

          res.status(400).end('email or password is wrong');
        } catch (rlRejected) {
          if (rlRejected instanceof Error) {
            throw rlRejected;
          } else {
            res.set('Retry-After', String(Math.round(rlRejected.msBeforeNext / 1000) || 1));
            res.status(429).send('Too Many Requests');
          }
        }
      }
    }
  };
}

export default AuthController;
