import { Router } from 'express';
import { AsistenteController } from '../controller/asistente.js';
import { createBaseRouter } from './base-router.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createAsistenteRouter = (AsistenteModel, AsistenteSchema) => {
     const asistenteController = new AsistenteController(
          AsistenteModel,
          AsistenteSchema
     );

     // Creamos el router con las rutas básicas
     const asistenteRouter = createBaseRouter(asistenteController);

     // Rutas extra específicas de Asistente
     //asistenteRouter.post('/buscarPorNombre', asistenteController.buscarPorNombre);

     return asistenteRouter;
};
