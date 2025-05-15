import { Router } from "express";
import { CategoriaController } from "../controller/categoria.js";
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createCategoriaRouter = (CategoriaModel, categoriaSchema) => {
  const categoriaRouter = Router();

  //instanciamos el movie controller ya que utiliza un constructor que pide
  //que controlador usara,esto para tener en practica la inyeccion de dependencias
  const categoriaController = new CategoriaController(
    CategoriaModel,
    categoriaSchema
  );

  categoriaRouter.post("/create", categoriaController.create);

  categoriaRouter.post("/getBy", categoriaController.getBy);

  categoriaRouter.post("/delete", categoriaController.delete);

  categoriaRouter.post("/update", categoriaController.update);

  return categoriaRouter;
};
