import { Router } from "express";
import { HorarioController } from "../controller/horario.js";

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createHorarioRouter = (HorarioModel, horarioSchema) => {
  const horarioRouter = Router();

  //instanciamos el movie controller ya que utiliza un constructor que pide
  //que controlador usara,esto para tener en practica la inyeccion de dependencias
  const horarioController = new HorarioController(HorarioModel, horarioSchema);

  horarioRouter.post("/create", horarioController.create);

  horarioRouter.post("/getBy", horarioController.getBy);

  horarioRouter.post("/delete", horarioController.delete);

  horarioRouter.post("/update", horarioController.update);

  return horarioRouter;
};
