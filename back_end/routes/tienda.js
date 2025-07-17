import { Router } from 'express';
import { TiendaController } from '../controller/tienda';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createTiendaRouter = (TiendaModel, TiendaSchema) => {
     const tiendaRouter = Router();

     const tiendaController = new TiendaController(TiendaModel, TiendaSchema);

     tiendaRouter.post('/create', tiendaController.create);

     tiendaRouter.post('/getBy', tiendaController.getBy);

     tiendaRouter.post('/delete', tiendaController.delete);

     tiendaRouter.post('/update', tiendaController.update);

     return tiendaRouter;
};
