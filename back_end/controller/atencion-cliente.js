import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dialogflow = require("@google-cloud/dialogflow");
require("dotenv").config();

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
}
