import * as express from 'express';
import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import ControllerInterface from '../interfaces/controller.interface';

import {
  login, get,
} from '../crud/user.crud';
import {
  expiresIn, maxConsecutiveFailsByUsernameAndIP, maxWrongAttemptsByIPPerDay, secret,
} from '../config';
import JwtPayloadInterface from '../interfaces/jwt-payload.interface';
import { authMiddleware } from '../middleware/auth.middleware';
import app from '../index';
import response from '../structures/response.structures';

class AuthController implements ControllerInterface {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get('/auth/me', authMiddleware, this.getMe);
    this.router.post('/auth/login', this.login);
  }

  // return the current user for a logged in check
  getMe = async (req: Request, res: Response) => response(res, true, req.user, '');

  // eslint-disable-next-line consistent-return
  login = async (req: Request, res: Response) => {
    // get the request body
    const reqBody = req.body;

    // if the password and username aren't strings
    if (typeof reqBody.username !== 'string' || typeof reqBody.password !== 'string') {
      // return error message
      return response(res, false, null, 'Please specify a username and password', 400);
    }

    // get the ip address from the api
    const ipAddr = req.ip;

    // combine the user name and the api
    const usernameIPkey = `${req.body.username}_${ipAddr}`;

    // rate limiter
    const [resUsernameAndIP, resSlowByIP] = await Promise.all([
      app.FailsByUsernameAndIP.get(usernameIPkey),
      app.IPLimiter.get(ipAddr),
    ]);

    let retrySecs = 0;

    // If the ip is blocked
    if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPPerDay) {
      // set a timeout before the next request
      retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
    } else if (resUsernameAndIP !== null
            && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
      // set a timeout before the next request
      retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
    }

    // if there's a time-out for the user
    if (retrySecs > 0) {
      // set a Retry-After header for the response
      res.set('Retry-After', String(retrySecs));

      // return a error message
      res.status(429)
        .send('Too Many Requests');
    } else {
      // get the user from the database
      const user = await login(reqBody.username);

      // if there's an user and the password is valid
      if (user && await argon2.verify(user.password, reqBody.password)) {
        // if the user has failed attempts
        if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
          // delete the attempts
          await app.FailsByUsernameAndIP.delete(usernameIPkey);
        }
        // create the jwt
        const payload: JwtPayloadInterface = {
          userId: user.id,
        };

        // sign the jwt
        jwt.sign(
          payload,
          secret,
          {
            expiresIn,
          } as SignOptions,
          async (err, token) => {
            if (err) throw err;
            const reqUser = await get(reqBody.username);
            response(res, true, { expiresIn, token, reqUser }, '');
          },
        );
      } else {
        // Add one point and block if limit is reached
        try {
          // get the promisses
          const promises = [app.IPLimiter.consume(ipAddr)];
          // if there's a user in the db
          if (user) {
            // Count failed attempts
            promises.push(app.FailsByUsernameAndIP.consume(usernameIPkey));
          }
          await Promise.all(promises);

          // return invalid password
          res.status(400)
            .end('Invalid email or password');
        } catch (rlRejected) {
          // if there's an error
          if (rlRejected instanceof Error) {
            // throw the error
            throw rlRejected;
          } else {
            // return the 'Retry-After' header with the time out
            res.set('Retry-After', String(Math.round(rlRejected.msBeforeNext / 1000) || 1));

            // return error message
            res.status(429)
              .send('Too Many Requests');
          }
        }
      }
    }
  };
}

export default AuthController;
