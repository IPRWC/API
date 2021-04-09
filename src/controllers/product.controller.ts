import * as express from 'express';
import { Request, Response } from 'express';
import ControllerBase from '../interfaces/controller.interface';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getAll, get, create, remove, edit,
} from '../crud/product.crud';
import response from '../structures/response.structures';

class ProductController implements ControllerBase {
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  public initRoutes() {
    this.router.get('/products', this.getAll);
    this.router.get('/products/:id', this.getProduct);
    this.router.post('/products', authMiddleware, this.createProduct);
    this.router.delete('/products/:id', authMiddleware, this.deleteProduct);
    this.router.patch('/products/:id', authMiddleware, this.updateProduct);
  }

  getAll = async (req: Request, res: Response) => {
    // get all the user from the database
    const products = await getAll();

    // if there aren't any products
    if (products.length < 1) {
      // return error message
      return response(res, false, null, 'No products found', 404);
    }

    // return the products
    return response(res, true, products, '');
  };

  getProduct = async (req: Request, res: Response) => {
    try {
      // get the product from the database
      const product = await get(req.params.id);

      // return the product
      return response(res, true, product, '');
    } catch (error) {
      // return error message
      return response(res, false, null, error.toString(), 404);
    }
  };

  createProduct = async (req: Request, res: Response) => {
    try {
      // if the user isn't an admin
      if (!req.user.admin) {
        // return not authorized message
        return response(res, false, null, 'Not authorized', 403);
      }

      // create the product
      await create(req.body);

      // return success message
      return response(res, true, null, 'Product created', 201);
    } catch (error) {
      // return error message
      return response(res, false, null, error.toString(), 400);
    }
  };

  deleteProduct = async (req: Request, res: Response) => {
    try {
      // if the user isn't an admin
      if (!req.user.admin) {
        // return not authorized message
        return response(res, false, null, 'Not authorized', 403);
      }

      // delete the product
      await remove(req.params.id);

      // return success message
      return response(res, true, null, 'Product deleted', 200);
    } catch (error) {
      // return the error message
      return response(res, false, null, error.toString(), 400);
    }
  };

  updateProduct = async (req: Request, res: Response) => {
    try {
      // if the user isn't an admin
      if (!req.user.admin) {
        // return not authorized message
        return response(res, false, null, 'Not authorized', 403);
      }
      // if the admin want's to update the name
      if (req.body.name) {
        // edit the name
        await edit(req.params.id, req.body.name, 'name');
      }
      // if the admin want's to update the description
      if (req.body.description) {
        // edit the description
        await edit(req.params.id, req.body.description, 'description');
      }
      // if the admin want's to update the price
      if (req.body.price) {
        // edit the price
        await edit(req.params.id, req.body.price, 'price');
      }
      // if the admin want's to update the image
      if (req.body.image) {
        // edit the image
        await edit(req.params.id, req.body.image, 'image');
      }

      // return success message
      return response(res, true, null, 'Product edited');
    } catch (error) {
      // return error message
      return response(res, false, null, error.toString(), 400);
    }
  };
}

export default ProductController;
