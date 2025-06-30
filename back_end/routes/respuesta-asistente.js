import { Router } from 'express';
import { RespuestaAsistenteController } from '../controller/respuesta-asistente.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createRespuestaAsistenteRouter = (
     RespuestaAsistenteModel,
     RespuestaAsistenteSchema
) => {
     const respuestaAsistenteRouter = Router();

     const respuestaAsistenteController = new RespuestaAsistenteController(
          RespuestaAsistenteModel,
          RespuestaAsistenteSchema
     );

     respuestaAsistenteRouter.post(
          '/create',
          respuestaAsistenteController.create
     );

     respuestaAsistenteRouter.post(
          '/getBy',
          respuestaAsistenteController.getBy
     );

     respuestaAsistenteRouter.post(
          '/delete',
          respuestaAsistenteController.delete
     );

     respuestaAsistenteRouter.post(
          '/update',
          respuestaAsistenteController.update
     );

     return respuestaAsistenteRouter;
};
