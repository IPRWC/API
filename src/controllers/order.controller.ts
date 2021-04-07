import * as express from 'express';
import { Request, Response } from 'express';
import {
  create, getAll, getOrder, getAllForUser, addBatchToOrder,
} from '../crud/order.crud';
import {
  get,
} from '../crud/user.crud';
import ControllerInterface from '../interfaces/controller.interface';
import { authMiddleware } from '../middleware/auth.middleware';
import response from '../structures/response.structures';

class OrderController implements ControllerInterface {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get('/orders', authMiddleware, this.getAll);
    this.router.get('/orders/:username', authMiddleware, this.getOrdersForUser);
    this.router.get('/orders/:username/:id', authMiddleware, this.getOrder);
    this.router.post('/orders/:username', authMiddleware, this.createOrder);
  }

  getAll = async (req: Request, res: Response) => {
    // if the user isn't an admin
    if (!req.user.admin) {
      // return error message
      return response(res, false, null, 'Not authorized', 403);
    }

    // get all the orders from the database
    const orders = await getAll();

    // if there aren't any orders
    if (orders.length < 1) {
      // return error message
      return response(res, false, null, 'No orders found', 404);
    }

    // return the orders
    return response(res, true, orders, '');
  };

  getOrdersForUser = async (req: Request, res: Response) => {
    // if the user isn't an admin or the requested user doesn't equal the current user
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

    // get the orders for this user from the database
    const orders = await getAllForUser(user);

    // if there aren't any orders
    if (orders.length < 0) {
      return response(res, false, null, 'No orders found', 404);
    }

    // return the orders
    return response(res, true, orders, '');
  };

  getOrder = async (req: Request, res: Response) => {
    try {
      // if the user isn't an admin or the requested user doesn't equal the current user
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

      // get the order from the database
      const order = await getOrder(user, req.params.id);

      // return the orders
      return response(res, true, order, '');
    } catch (error) {
      // return error message
      return response(res, false, null, error.toString(), 400);
    }
  };

  createOrder = async (req: Request, res: Response) => {
    try {
      // if the user isn't an admin or the requested user doesn't equal the current user
      if (!req.user.admin && req.user.username !== req.params.username) {
        // return unauthorized message
        return response(res, false, null, 'Not authorized', 403);
      }

      // get the username from the user
      const { username } = req.params;

      // get the batches and the order data from the request body
      const { totalPrice, reqBatches } = req.body;

      // get the user from the database
      const user = await get(username);

      // if the user isn't found
      if (!user) {
        // return error message
        return response(res, false, null, 'No user found', 400);
      }

      // create the order
      const order = await create(user, totalPrice);

      // add the batches to the order
      const batches = await addBatchToOrder(user, order, reqBatches);

      // return the order
      return response(res, true, order, '');
    } catch (error) {
      // return error message
      return response(res, false, null, error.toString(), 400);
    }
  };
}

export default OrderController;
