import { Router } from "express";
import { ProductoController } from "../controller/producto.js";

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createProductoRouter = (ProductoModel, productoSchema) => {
  const productoRouter = Router();

  //instanciamos el movie controller ya que utiliza un constructor que pide
  //que controlador usara,esto para tener en practica la inyeccion de dependencias
  const productoController = new ProductoController(
    ProductoModel,
    productoSchema
  );

  productoRouter.post("/create", productoController.create);

  productoRouter.post("/getBy", productoController.getBy);

  productoRouter.post("/delete", productoController.delete);

  productoRouter.post("/update", productoController.update);

  return productoRouter;
};
