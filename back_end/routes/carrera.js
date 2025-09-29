import { Router } from 'express';
import { CarreraController } from '../controller/carrera.js';
import { createBaseRouter } from './base-router.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createCarreraRouter = (CarreraModel, CarreraSchema) => {
     const carreraController = new CarreraController(
          CarreraModel,
          CarreraSchema
     );

     // Creamos el router con las rutas básicas
     const carreraRouter = createBaseRouter(carreraController);

     // Rutas extra específicas de TurnoCarrera
     //carreraRouter.post('/buscarPorNombre', carreraController.buscarPorNombre);

     return carreraRouter;
};
