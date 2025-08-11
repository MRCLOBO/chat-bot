import { Router } from 'express';
import { OrdenVentaController } from '../controller/orden_venta.js';
import { createBaseRouter } from './base-router.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createOrdenVentaRouter = (OrdenVentaModel, OrdenVentaSchema) => {
     //instanciamos el movie controller ya que utiliza un constructor que pide
     //que controlador usara,esto para tener en practica la inyeccion de dependencias
     const ordenVentaController = new OrdenVentaController(
          OrdenVentaModel,
          OrdenVentaSchema
     );

     const ordenVentaRouter = createBaseRouter(ordenVentaController);

     ordenVentaRouter.post('/getAllBy', ordenVentaController.getAllBy);

     return ordenVentaRouter;
};
