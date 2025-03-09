import express, { json } from "express";
//para importar la funcion require y poder importar JSONs
import { corsMiddleware } from "./middlewares/cors.js";
import { conectarBD, sequelize } from "./config/database.js";
import { createUsuariosrouter } from "./routes/usuarios.js";
import { UsuarioModel, UsuarioSchema } from "./models/usuarios.js";
import multer from "multer";
import path from "path";

const PORT = process.env.API_PORT ?? 3006;
const app = express();
app.disable("x-powered-by");
app.use(json()); // para transformar el body de la request de JSON a objeto
app.use(corsMiddleware());

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

const multerStorage = multer.diskStorage({
  //Se renombran los archivos que se alzen
  destination: "imagenes/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const multerUpload = multer({ multerStorage });

//basicamente en esta parte redirigimos todas las consultas de cualquier metodo a "/usuarios" al archivo usuariosRouter que ya maneja todas las solicitudes
app.use("/usuarios", createUsuariosrouter(UsuarioModel, UsuarioSchema));

//Servidor escuchando la conexion
app.listen(PORT, () => {
  console.log(
    `El servidor esta escuchando las conexiones en http://localhost:${PORT}`
  );
});
