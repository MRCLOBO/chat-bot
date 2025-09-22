import { Router } from 'express';
import { AlumnoController } from '../controller/alumno.js';
import { createBaseRouter } from './base-router.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createAlumnoRouter = (AlumnoModel, AlumnoSchema) => {
     const alumnoController = new AlumnoController(AlumnoModel, AlumnoSchema);

     // Creamos el router con las rutas básicas
     const alumnoRouter = createBaseRouter(alumnoController);

     // Rutas extra específicas de Alumno
     //alumnoRouter.post('/buscarPorNombre', alumnoController.buscarPorNombre);

     return alumnoRouter;
};
