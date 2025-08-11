import { Router } from 'express';
import { TiendaController } from '../controller/tienda.js';
import { createBaseRouter } from './base-router.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createTiendaRouter = (TiendaModel, TiendaSchema) => {
     const tiendaController = new TiendaController(TiendaModel, TiendaSchema);

     const tiendaRouter = createBaseRouter(tiendaController);

     return tiendaRouter;
};
