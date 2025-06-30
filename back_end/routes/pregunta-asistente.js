import { Router } from 'express';
import { PreguntaAsistenteController } from '../controller/pregunta-asistente.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createPreguntaAsistenteRouter = (
     PreguntaAsistenteModel,
     PreguntaAsistenteSchema
) => {
     const preguntaAsistenteRouter = Router();

     const preguntaAsistenteController = new PreguntaAsistenteController(
          PreguntaAsistenteModel,
          PreguntaAsistenteSchema
     );

     preguntaAsistenteRouter.post(
          '/create',
          preguntaAsistenteController.create
     );

     preguntaAsistenteRouter.post('/getBy', preguntaAsistenteController.getBy);

     preguntaAsistenteRouter.post(
          '/delete',
          preguntaAsistenteController.delete
     );

     preguntaAsistenteRouter.post(
          '/update',
          preguntaAsistenteController.update
     );

     return preguntaAsistenteRouter;
};
