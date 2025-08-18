import { Router } from 'express';
import { HistorialConversacionController } from '../controller/historial-conversacion.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createHistorialConversacionRouter = (
     HistorialConversacionModel,
     HistorialConversacionSchema
) => {
     const historialConversacionController =
          new HistorialConversacionController(
               HistorialConversacionModel,
               HistorialConversacionSchema
          );

     // Creamos el router con las rutas básicas
     const historialConversacionRouter = Router();

     // Rutas extra específicas de Asistente
     historialConversacionRouter.post(
          '/getAllBy',
          historialConversacionController.getAllBy
     );

     historialConversacionRouter.post(
          '/getBy',
          historialConversacionController.getBy
     );

     return historialConversacionRouter;
};
