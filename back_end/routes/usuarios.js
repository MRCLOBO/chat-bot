import { Router } from "express";
import { UsuarioController } from "../controller/usuarios.js";

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createUsuariosrouter = (UsuarioModel, usuarioSchema) => {
  const usuariosRouter = Router();

  //instanciamos el movie controller ya que utiliza un constructor que pide
  //que controlador usara,esto para tener en practica la inyeccion de dependencias
  const usuarioController = new UsuarioController(UsuarioModel, usuarioSchema);

  usuariosRouter.post("/create", usuarioController.create);

  usuariosRouter.post("/getBy", usuarioController.getBy);

  usuariosRouter.post("/delete", usuarioController.delete);

  usuariosRouter.post("/update", usuarioController.update);

  usuariosRouter.post("/login", usuarioController.login);

  return usuariosRouter;
};
