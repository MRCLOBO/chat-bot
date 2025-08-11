import { Router } from 'express';
import { ProductoController } from '../controller/producto.js';
import { createBaseRouter } from './base-router.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createProductoRouter = (ProductoModel, productoSchema) => {
     //instanciamos el movie controller ya que utiliza un constructor que pide
     //que controlador usara,esto para tener en practica la inyeccion de dependencias
     const productoController = new ProductoController(
          ProductoModel,
          productoSchema
     );

     const productoRouter = createBaseRouter(productoController);

     productoRouter.post('/mas-consultados', productoController.masConsultado);

     productoRouter.post('/getAllBy', productoController.getAllBy);

     return productoRouter;
};
