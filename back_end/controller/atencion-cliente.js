import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dialogflow = require("@google-cloud/dialogflow");
require("dotenv").config();
import { HorarioSchema } from "../models/horario.js";
import { ProductoSchema } from "../models/producto.js";
const { GoogleAuth } = require("google-auth-library");
const axios = require("axios");
import { Sequelize, DataTypes, Op, where } from "sequelize";

export class AtencionClienteController {
  //CREDENCIALES DE HELPI
  CREDENTIALS = JSON.parse(process.env.DF_HELPI_KEY);
  PROJECTID = this.CREDENTIALS.project_id;
  CONFIGURATION = {
    credentials: {
      private_key: this.CREDENTIALS["private_key"],
      client_email: this.CREDENTIALS["client_email"],
    },
  };

  //SE CREA UNA NUEVA SESION
  sessionClient = new dialogflow.SessionsClient(this.CONFIGURATION);

  //DETECTAR INTENT METHOD
  detectIntent = async (languageCode, queryText, sessionId) => {
    let sessionPath = this.sessionClient.projectAgentSessionPath(
      this.PROJECTID,
      sessionId
    );

    //EL TEXTO DEL QUERY REQUEST
    let request = {
      session: sessionPath,
      queryInput: {
        text: {
          //EL QUERY A MANDAR AL AGENTE DE DIALOGFLOW
          text: queryText,
          //EL LENGUAJE UTILIZADO POR EL CLIENTE es
          languageCode: languageCode,
        },
      },
    };

    //ENVIAR UNA RESPUESTA Y ESPERAR UN LOG RESULT
    const responses = await this.sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    return {
      response: result.fulfillmentText,
    };
  };

  consulta = async (req, res) => {
    try {
      const { sessionID, consultaUsuario, infoNegocio } = req.body;
      //Se realiza una consulta a los productos del negocio para poder realizar un entitie de estos
      const productos = await ProductoSchema.findAll({
        attributes: ["nombre_producto"],
        where: {
          id_negocio: infoNegocio.id_negocio, // asegurate de que esta variable tenga el valor correcto
        },
      });
      const productosNombres = productos.map((p) => p.nombre_producto);
      await this.crearSessionEntity(sessionID, productosNombres);
      const respuestaBOT = await this.detectIntent(
        "es",
        consultaUsuario,
        sessionID
      );

      return res.json({
        type: "success",
        message: "consulta exitosa",
        respuestaBOT: respuestaBOT.response,
      });
    } catch (error) {
      console.log(
        "###Ocurrio un error al hacer la consulta al chatbot###",
        error,
        "################################"
      );
      return res.json({
        type: "error",
        message:
          "Ocurrio un error en el servidor, por favor intentelo de nuevo mas tarde",
      });
    }
  };

  webhook = async (req, res) => {
    try {
      const intencion = req.body.queryResult.intent.displayName;
      switch (intencion) {
        case "infoHorario":
          const id_negocio = req.body.queryResult.parameters.id_negocio || 1;

          try {
            const horarios = await HorarioSchema.findAll({
              where: { id_negocio },
            });

            const respuestaHorario = this.construirMensajeHorarios(horarios);

            return res.json({
              fulfillmentText: respuestaHorario,
            });
          } catch (error) {
            console.error("Error al consultar horarios:", error);
            return res.json({
              fulfillmentText:
                "Ocurrió un error al consultar el horario. Intenta más tarde.",
            });
          }
          break;
        case "consultarDisponibilidadProducto":
          const nombreProducto = req.body.queryResult.parameters["producto"];

          try {
            const producto = await ProductoSchema.findOne({
              where: { nombre_producto: { [Op.iLike]: `%${nombreProducto}%` } },
            });

            let respuesta;

            if (!producto) {
              respuesta = `Lo siento, no tenemos el producto "${nombreProducto}".`;
            } else if (producto.cantidad > 5) {
              const precio = this.formatearGs(producto.precio);
              respuesta = `Sí, el producto "${producto.nombre_producto}" está disponible con un costo de ${precio}.`;
            } else if (producto.cantidad > 0) {
              const precio = this.formatearGs(producto.precio);
              respuesta = `Sí, nos quedan solo ${producto.cantidad} unidades de "${producto.nombre_producto}" este cuenta con un precio de ${precio}.`;
            } else {
              respuesta = `Lo siento, pero actualmente no tenemos disponibilidad de "${producto.nombre_producto}".`;
            }

            return res.json({
              fulfillmentText: respuesta,
            });
          } catch (error) {
            console.error(error);
            return res.json({
              fulfillmentText:
                "Ocurrió un error al consultar la disponibilidad. Por favor, intente nuevamente.",
            });
          }
        default:
          break;
      }

      console.log(
        "###  PREGUNTA PROVENIENTE DE CHATBOT ####",
        req.body,
        "###############################"
      );
      res.send({
        fulfillmentText:
          "Hola este es un mensaje que proviene del backend, ¿No me crees? una respuesta generica diria esto... Chimichangas!",
      });
    } catch (error) {
      console.log(
        "###Ocurrio un error al responder la consulta del chatbot###",
        error,
        "################################"
      );
      return res.json({
        type: "error",
        message:
          "Ocurrio un error en el servidor, por favor intentelo de nuevo mas tarde",
      });
    }
  };

  construirMensajeHorarios(horarios) {
    const ordenDias = [
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];

    const horariosOrdenados = horarios
      .filter((h) => h.disponible)
      .sort((a, b) => ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia));

    if (horariosOrdenados.length === 0) {
      return "Actualmente no tenemos horarios disponibles.";
    }

    let mensaje = "🕒 Nuestro horario de atención es:\n";
    for (const horario of horariosOrdenados) {
      mensaje += `📅 ${horario.dia}: de ${horario.apertura} a ${horario.cierre}\n`;
    }
    return mensaje;
  }
  buscarDisponibilidadProducto = async (nombre, id_negocio) => {
    try {
      const productos = await ProductoSchema.findAll({
        where: {
          nombre_producto: {
            [Op.like]: `%${nombre}%`,
          },
          id_negocio,
        },
        order: [["consultas", "DESC"]],
        limit: 3,
      });

      if (productos.length === 0) {
        return `Lo siento... actualmente no contamos con el articulo '${nombre}', ¿Tienes algun otro articulo de interes?`;
      }

      const producto = productos[0]; // el más consultado

      let mensaje = "";

      if (producto.cantidad > 5) {
        mensaje = `El producto "${producto.nombre_producto}" está disponible. Cuenta con un precio de ''`;
      } else if (producto.cantidad > 0) {
        mensaje = `El producto "${producto.nombre_producto}" está disponible, pero solo quedan ${producto.cantidad} unidades.`;
      } else {
        mensaje = `El producto "${producto.nombre_producto}" no se encuentra disponible por el momento.`;
      }

      if (productos.length > 1) {
        mensaje += `\n\nParece que tenemos más de un producto relacionado con "${nombre}". ¿Podrías ser un poco más específico?`;
      }

      return mensaje;
    } catch (err) {
      console.error("Error al buscar disponibilidad:", err);
      return "Hubo un problema al consultar la disponibilidad del producto.";
    }
  };
  formatearGs = (monto) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0, // Guaraníes no usan decimales normalmente
    }).format(monto);
  };
  async crearSessionEntity(sessionId, productosNombres) {
    const CREDENTIALS = JSON.parse(process.env.DF_HELPI_KEY);
    const auth = new GoogleAuth({
      credentials: CREDENTIALS,
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const projectId = process.env.DF_PROYECT_ID;
    const entityTypeName = "producto";

    const sessionEntity = {
      name: `projects/${projectId}/agent/sessions/${sessionId}/entityTypes/${entityTypeName}`,
      entityOverrideMode: "ENTITY_OVERRIDE_MODE_OVERRIDE",
      entities: productosNombres.map((nombre) => ({
        value: nombre,
        synonyms: [nombre],
      })),
    };

    await axios.put(
      `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${sessionId}/entityTypes`,
      sessionEntity,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
  }
}
