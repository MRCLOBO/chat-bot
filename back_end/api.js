import express, { json } from "express";
//para importar la funcion require y poder importar JSONs
import { corsMiddleware } from "./middlewares/cors.js";
import { conectarBD, sequelize } from "./config/database.js";
import { createUsuariosrouter } from "./routes/usuarios.js";
import { UsuarioModel, UsuarioSchema } from "./models/usuarios.js";
import path from "path";
import { createNegocioRouter } from "./routes/negocios.js";
import { NegocioModel, NegocioSchema } from "./models/negocios.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const multer = require("multer");

const PORT = process.env.API_PORT ?? 3006;
const app = express();
app.disable("x-powered-by");
app.use(corsMiddleware());
// app.use(express.urlencoded({ extended: true })); // para procesar formularios

// const storage = multer.diskStorage({
//   destination: "uploads/",
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "imagenes/");
    },
    filename: (req, file, cb) => {
      const imagen = Date.now() + "-" + file.originalname;
      req.body.nombre_imagen = imagen;
      cb(null, imagen);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const guardarArchivo = upload.single("imagen");

app.post("/subir-imagen", guardarArchivo, (req, res) => {
  return res.status(200).json({
    type: "success",
    message: "Imagen guardada en el servidor",
    nombre_imagen: req.body.nombre_imagen,
  });
});

app.use(json()); // para transformar el body de la request de JSON a objeto al hacer esto ya no se pueden procesar files

//Conexion a la BD
conectarBD();
sequelize
  .sync({ force: false })
  .then(() => console.log("✅ Tablas sincronizadas"))
  .catch((error) => console.error("❌ Error al sincronizar tablas:", error));

//Para saber cada vez que se reciba una solicitud en la API
app.use((req, res, next) => {
  console.log("request recibido el ", new Date().toString());
  next();
});

// para que se pueda acceder a la carpeta imagenes a traves de la URL
app.use(
  "/imagenes",
  express.static(path.join(process.env.URLBASE, "imagenes"))
);

//basicamente en esta parte redirigimos todas las consultas de cualquier metodo a "/usuarios" al archivo usuariosRouter que ya maneja todas las solicitudes
app.use("/usuarios", createUsuariosrouter(UsuarioModel, UsuarioSchema));

//redirigimos todos lo que vena de negocios
app.use("/negocios", createNegocioRouter(NegocioModel, NegocioSchema));

//PRUEBA DE DIALOGFLOW
const dialogflow = require("@google-cloud/dialogflow");
require("dotenv").config();

//CREDENCIALES DE HELPI
const CREDENTIALS = JSON.parse(process.env.DF_HELPI_KEY);

const PROJECTID = CREDENTIALS.project_id;

const CONFIGURATION = {
  credentials: {
    private_key: CREDENTIALS["private_key"],
    client_email: CREDENTIALS["client_email"],
  },
};

//SE CREA UNA NUEVA SESION
const sessionClient = new dialogflow.SessionsClient(CONFIGURATION);

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
//PRUEBA DE DIALOGFLOW

//Servidor escuchando la conexion
app.listen(PORT, () => {
  console.log(
    `El servidor esta escuchando las conexiones en http://localhost:${PORT}`
  );
});
