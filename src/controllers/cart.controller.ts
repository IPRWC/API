import * as express from 'express';
import { Request, Response } from 'express';
import {
  getCart, addBatches,
} from '../crud/cart.crud';
import {
  get,
} from '../crud/user.crud';
import ControllerInterface from '../interfaces/controller.interface';
import { authMiddleware } from '../middleware/auth.middleware';
import response from '../structures/response.structures';

class CartController implements ControllerInterface {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get('/cart/:username', authMiddleware, this.getCart);
    this.router.post('/cart/:username/products', authMiddleware, this.addBatchesToCart);
  }

  getCart = async (req: Request, res: Response) => {
    // if the user isn't an admin and the requested user doesn't equal the current user
    if (!req.user.admin && req.user.username !== req.params.username) {
      // return unauthorized message
      return response(res, false, null, 'Not authorized', 403);
    }

    // get the user from the database
    const user = await get(req.params.username);

    // if the user isn't found
    if (!user) {
      // return error message
      return response(res, false, null, 'No user found', 400);
    }

    // get the cart
    const cart = await getCart(user);

    // return the cart
    return response(res, true, cart, '');
  };

  addBatchesToCart = async (req: Request, res: Response) => {
    try {
      // if the user isn't an admin and the requested user doesn't equal the current user
      if (!req.user.admin && req.user.username !== req.params.username) {
        // return unauthorized message
        return response(res, false, null, 'Not authorized', 403);
      }

      // get the user from the database
      const user = await get(req.params.username);

      // if the user isn't found
      if (!user) {
        // return error message
        return response(res, false, null, 'No user found', 400);
      }

      await addBatches(user, req.body);

      // return the success message
      return response(res, true, null, 'Added products to cart');
    } catch (error) {
      // return the error message
      return response(res, false, null, error.toString(), 400);
    }
  };
}

export default CartController;
