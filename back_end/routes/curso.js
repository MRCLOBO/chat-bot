import { Router } from 'express';
import { CursoController } from '../controller/curso.js';
import { createBaseRouter } from './base-router.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createCursoRouter = (CursoModel, CursoSchema) => {
     const cursoController = new CursoController(CursoModel, CursoSchema);

     // Creamos el router con las rutas básicas
     const cursoRouter = createBaseRouter(cursoController);

     // Rutas extra específicas de Curso
     //curosRouter.post('/buscarPorNombre', cursoController.buscarPorNombre);

     return cursoRouter;
};
