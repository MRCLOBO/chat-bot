import { Router } from "express";
import { AtencionClienteController } from "../controller/atencion-cliente.js";

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createAtencionClienteRouter = () => {
  const atencionClienteRouter = Router();

  const atencionClienteController = new AtencionClienteController();

  atencionClienteRouter.post("/consulta", atencionClienteController.consulta);

  return atencionClienteRouter;
};
