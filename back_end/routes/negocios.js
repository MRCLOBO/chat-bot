import { Router } from "express";
import { NegocioController } from "../controller/negocios.js";

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createNegocioRouter = (NegocioModel, NegocioSchema) => {
  const negocioRouter = Router();

  const negocioController = new NegocioController(NegocioModel, NegocioSchema);

  negocioRouter.post("/create", negocioController.create);

  negocioRouter.post("/getBy", negocioController.getBy);

  negocioRouter.post("/delete", negocioController.delete);

  negocioRouter.post("/update", negocioController.update);

  return negocioRouter;
};
