import { Router } from 'express';
import { RespuestaAsistenteController } from '../controller/respuesta-asistente.js';
import { createBaseRouter } from './base-router.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createRespuestaAsistenteRouter = (
     RespuestaAsistenteModel,
     RespuestaAsistenteSchema
) => {
     const respuestaAsistenteController = new RespuestaAsistenteController(
          RespuestaAsistenteModel,
          RespuestaAsistenteSchema
     );

     const respuestaAsistenteRouter = createBaseRouter(
          respuestaAsistenteController
     );

     return respuestaAsistenteRouter;
};
