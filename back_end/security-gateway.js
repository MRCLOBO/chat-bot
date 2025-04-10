// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// import cors from "cors";
// import dotenv from "dotenv";
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");

// const serviceAccount = require(process.env.PATH_DF_KEY);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const { SessionClient } = require("dialogflow");

// exports.dialogflowGateway = functions.https.onRequest((request, response) => {
//   cors(request, response, async () => {
//     //QUERYINPUT: datos que el usuario esta intentando consultar al bot
//     const { queryInput, sessionId } = request.body;

//     const sessionClient = new SessionClient({ credentials: serviceAccount });
//     const session = sessionClient.sessionPath("HELPI API", sessionId);

//     const responses = await sessionClient.detectIntent({ session, queryInput });

//     const result = responses[0].queryResult;

//     response.send(result);
//   });
// });
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dialogflow = require("@google-cloud/dialogflow");
require("dotenv").config();
const express = require("express");

//CREDENCIALES DE HELPI
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

const PROJECTID = CREDENTIALS.project_id;

const CONFIGURATION_DF = {
  credentials: {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email,
  },
};

//SE CREA UNA NUEVA SESION
const sessionClient = new dialogflow.SessionsClient(CONFIGURATION_DF);

//DETECTAR INTENT METHOD
const detectIntent = async (languageCode, queryText, sessionId) => {
  let sessionPath = sessionClient.projectAgentSessionPath(PROJECTID, sessionId);

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
  const responses = await sessionClient.detectIntent(request);
  console.log(" RESPUESTAS DEL BOT :", responses);
  const result = responses[0].queryResult;
  console.log(" RESULTADO :", result);

  return {
    response: result.fulfillmentText,
  };
};

detectIntent("es", "hola", "abcd1234");
