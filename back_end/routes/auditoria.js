import { Router } from 'express';
import { AuditoriaController } from '../controller/auditoria.js';
import { createBaseRouter } from './base-router.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createAuditoriaRouter = (Model, Schema) => {
     const controller = new AuditoriaController(Model, Schema);

     // Creamos el router con las rutas básicas
     const router = Router();
     // const router = createBaseRouter(controller);

     // Rutas extra específicas de Alumno
     //alumnoRouter.post('/buscarPorNombre', controller.buscarPorNombre);

     router.post('/getAllBy', controller.getAllBy);

     return router;
};
