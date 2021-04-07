import * as express from 'express';
import { Request, Response } from 'express';
import ControllerBase from '../interfaces/controller.interface';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import {
  create, getAll, get, remove,
} from '../crud/user.crud';
import response from '../structures/response.structures';

class UserController implements ControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get('/users', authMiddleware, this.getAll);
    this.router.get('/users/:username', authMiddleware, this.get);
    this.router.post('/users', optionalAuthMiddleware, this.create);
    this.router.delete('/users/:username', authMiddleware, this.delete);
  }

  getAll = async (req: Request, res: Response) => {
    // if the user isn't an admin
    if (!req.user.admin) {
      // return the unauthorized message
      return response(res, false, null, 'Not authorized', 403);
    }

    // get all the user from the database
    const users = await getAll();

    // if there aren't any users
    if (users.length < 1) {
      // return error message
      return response(res, false, null, 'No users found', 404);
    }

    // return all the users
    return response(res, true, users, '');
  };

  get = async (req: Request, res: Response) => {
    try {
      // get the user from the database
      const user = await get(req.params.username);

      // if the user isn't an admin and the current user doesn't equal the requested user
      if (!req.user.admin && req.user.username !== req.params.username) {
        // return the unauthorized message
        return response(res, false, null, 'Not authorized', 403);
      }

      // return the user
      return response(res, true, user, '');
    } catch (error) {
      // if there's an error return the error
      return response(res, false, null, error.toString(), 400);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      // if the requesting user isn't an admin
      if (!req.user?.admin) {
        // if the user wan't to create an admin
        if (req.body.admin) {
          // return unauthorized message
          return response(res, false, null, 'Not authorized', 400);
        }
        // set the admin to false
        req.body.admin = false;
      }

      // create the user
      await create(req.body);

      // return a success message
      return response(res, true, null, 'User created', 201);
    } catch (error) {
      // return error message
      return response(res, false, null, error.toString(), 400);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      // if the user isn't an admin and doesn't equal the requesting user
      if (!req.user.admin && req.user.username !== req.params.username) {
        return response(res, false, null, 'Not authorized', 402);
      }

      // remove the user
      await remove(req.params.username);

      // return success message
      return response(res, true, null, 'User deleted', 410);
    } catch (error) {
      // return error message
      return response(res, false, null, error.toString(), 400);
    }
  };
}

export default UserController;
