import { Router } from 'express';
import { TurnoCarreraController } from '../controller/turno_carrera.js';
import { createBaseRouter } from './base-router.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createTurnoCarreraRouter = (
     TurnoCarreraModel,
     TurnoCarreraSchema
) => {
     const turnoCarreraController = new TurnoCarreraController(
          TurnoCarreraModel,
          TurnoCarreraSchema
     );

     // Creamos el router con las rutas básicas
     const turnoCarreraRouter = createBaseRouter(turnoCarreraController);

     // Rutas extra específicas de TurnoCarrera
     //turnoCarreraRouter.post('/buscarPorNombre', turnoCarreraController.buscarPorNombre);

     return turnoCarreraRouter;
};
