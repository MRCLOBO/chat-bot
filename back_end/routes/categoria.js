import { Router } from 'express';
import { CategoriaController } from '../controller/categoria.js';
import { createBaseRouter } from './base-router.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createCategoriaRouter = (CategoriaModel, categoriaSchema) => {
     //instanciamos el movie controller ya que utiliza un constructor que pide
     //que controlador usara,esto para tener en practica la inyeccion de dependencias
     const categoriaController = new CategoriaController(
          CategoriaModel,
          categoriaSchema
     );

     const categoriaRouter = createBaseRouter(categoriaController);

     // categoriaRouter.post("/create", categoriaController.create);

     // categoriaRouter.post("/getBy", categoriaController.getBy);

     // categoriaRouter.post("/delete", categoriaController.delete);

     // categoriaRouter.post("/update", categoriaController.update);

     return categoriaRouter;
};
