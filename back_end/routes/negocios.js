import { Router } from 'express';
import { NegocioController } from '../controller/negocios.js';
import { createBaseRouter } from './base-router.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createNegocioRouter = (NegocioModel, NegocioSchema) => {
     const negocioController = new NegocioController(
          NegocioModel,
          NegocioSchema
     );

     const negocioRouter = createBaseRouter(negocioController);

     return negocioRouter;
};
