import { Router } from 'express';
import { AsistenteController } from '../controller/asistente.js';
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createAsistenteRouter = (AsistenteModel, AsistenteSchema) => {
     const asistenteRouter = Router();

     const asistenteController = new AsistenteController(
          AsistenteModel,
          AsistenteSchema
     );

     asistenteRouter.post('/create', asistenteController.create);

     asistenteRouter.post('/getBy', asistenteController.getBy);

     asistenteRouter.post('/delete', asistenteController.delete);

     asistenteRouter.post('/update', asistenteController.update);

     return asistenteRouter;
};
