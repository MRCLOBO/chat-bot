import { Router } from 'express';
import { AnhoCarreraController } from '../controller/anho_carrera.js';
import { createBaseRouter } from './base-router.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createAnhoCarreraRouter = (
     AnhoCarreraModel,
     AnhoCarreraSchema
) => {
     const anhoCarreraController = new AnhoCarreraController(
          AnhoCarreraModel,
          AnhoCarreraSchema
     );

     // Creamos el router con las rutas básicas
     const anhoCarreraRouter = createBaseRouter(anhoCarreraController);

     // Rutas extra específicas de AnhoCarrera
     //anhoCarreraRouter.post('/buscarPorNombre', anhoCarreraController.buscarPorNombre);

     return anhoCarreraRouter;
};
