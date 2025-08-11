import { Router } from 'express';
import { HorarioController } from '../controller/horario.js';
import { createBaseRouter } from './base-router.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createHorarioRouter = (HorarioModel, horarioSchema) => {
     //instanciamos el movie controller ya que utiliza un constructor que pide
     //que controlador usara,esto para tener en practica la inyeccion de dependencias
     const horarioController = new HorarioController(
          HorarioModel,
          horarioSchema
     );

     const horarioRouter = createBaseRouter(horarioController);

     return horarioRouter;
};
