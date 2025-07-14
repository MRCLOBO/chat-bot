import { Router } from 'express';
import { VariablePreguntaController } from '../controller/variable-pregunta.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createVariablePreguntaRouter = (
     VariablePreguntaModel,
     VariablePreguntaSchema
) => {
     const variablePreguntaRouter = Router();

     const variablePreguntaController = new VariablePreguntaController(
          VariablePreguntaModel,
          VariablePreguntaSchema
     );

     variablePreguntaRouter.post('/create', variablePreguntaController.create);

     variablePreguntaRouter.post('/getBy', variablePreguntaController.getBy);

     variablePreguntaRouter.post('/delete', variablePreguntaController.delete);

     variablePreguntaRouter.post('/update', variablePreguntaController.update);

     return variablePreguntaRouter;
};
