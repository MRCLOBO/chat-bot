import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dialogflow = require("@google-cloud/dialogflow");
require("dotenv").config();
import { HorarioSchema } from "../models/horario.js";

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
      const { sessionID, consultaUsuario } = req.body;
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

      if (intencion === "infoHorario") {
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
}
