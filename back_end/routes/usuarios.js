import { Router } from 'express';
import { UsuarioController } from '../controller/usuarios.js';
import { createBaseRouter } from './base-router.js';

//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createUsuariosrouter = (UsuarioModel, usuarioSchema) => {
     //instanciamos el movie controller ya que utiliza un constructor que pide
     //que controlador usara,esto para tener en practica la inyeccion de dependencias
     const usuarioController = new UsuarioController(
          UsuarioModel,
          usuarioSchema
     );

     const usuariosRouter = createBaseRouter(usuarioController);

     usuariosRouter.post('/login', usuarioController.login);

     usuariosRouter.get('/vu', usuarioController.verificarUsuarios);

     return usuariosRouter;
};
