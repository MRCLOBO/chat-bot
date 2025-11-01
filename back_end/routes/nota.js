import { Router } from "express";
import { NotaController } from "../controller/nota.js";
import { createBaseRouter } from "./base-router.js";
//exportamos el router para la inyeccion de dependencia de modelo, para recibir por parametro el modelo
export const createNotaRouter = (NotaModel, NotaSchema) => {
    const notaController = new NotaController(NotaModel, NotaSchema);

    // Creamos el router con las rutas básicas
    const notaRouter = createBaseRouter(notaController);

    // Rutas extra específicas de Nota
    //notaRouter.post('/buscarPorNombre', notaController.buscarPorNombre);

    return notaRouter;
};
