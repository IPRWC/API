import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { secret } from '../config';
import { getUserById } from '../crud/user.crud';
import JwtPayloadInterface from '../interfaces/jwt-payload.interface';

const authMiddleware = async (req: Request, res: Response, next: any) => {
  let token = req.header('authorization');
  if (!token) return res.status(403).json('Not authorized');
  token = token.replace(/^Bearer\s+/, '');
  try {
    const decoded: JwtPayloadInterface = jwt.verify(token, secret) as JwtPayloadInterface;
    req.user = await getUserById(decoded.userId);
    next();
  } catch (e) {
    res.status(403).json('Invalid Token');
  }
};

const optionalAuthMiddleware = async (req: Request, res: Response, next: any) => {
  let token = req.header('authorization');
  if (!token) {
    next();
  } else {
    token = token.replace(/^Bearer\s+/, '');
    try {
      const decoded: JwtPayloadInterface = jwt.verify(token, secret) as JwtPayloadInterface;
      req.user = await getUserById(decoded.userId);
      next();
    } catch (e) {
      res.status(403).json('Invalid Token');
    }
  }
};

export {
  authMiddleware,
  optionalAuthMiddleware,
};
