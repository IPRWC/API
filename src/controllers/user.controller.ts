import * as express from 'express';
import { Request, Response } from 'express';
import ControllerBase from '../interfaces/controller.interface';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import {
  createUser, getAllUsers, getUser, deleteUser,
} from '../crud/user.crud';

class UserController implements ControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get('/users', authMiddleware, this.getAllUsers);
    this.router.get('/users/:username', authMiddleware, this.getUser);
    this.router.post('/users', optionalAuthMiddleware, this.createUser);
    this.router.delete('/users/:username', authMiddleware, this.deleteUser);
  }

  getAllUsers = async (req: Request, res: Response) => {
    if (!req.user.admin) return res.status(403).json('Not authorized');

    const users = await getAllUsers();
    if (users.length === 0) {
      return res.status(404).json('Could not find users');
    }
    return res.status(200).json(users);
  };

  getUser = async (req: Request, res: Response) => {
    try {
      const user = await getUser(req.params.username);
      console.log(req.user);
      if (!req.user.admin && req.user.username !== req.params.username) return res.status(403).json('Not authorized');
      return res.json(user);
    } catch (error) {
      return res.status(404).json(error.toString());
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      if (!req.user?.admin) {
        if (req.body.admin) return res.status(400).json('Not authorized to create admin user');
        req.body.admin = false;
        await createUser(req.body);
        return res.json('Successfully created user');
      }
      await createUser(req.body);
      return res.json('Successfully created user');
    } catch (error) {
      return res.status(400).json(error.toString());
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      if (!req.user.admin && req.user.username !== req.params.username) return res.status(403).json('Not authorized');
      await deleteUser(req.params.username);
      return res.json('Successfully deleted user');
    } catch (error) {
      return res.status(400)
        .json(error.toString());
    }
  };
}

export default UserController;
