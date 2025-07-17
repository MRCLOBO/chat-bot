import express, { json } from 'express';
//para importar la funcion require y poder importar JSONs
import { corsMiddleware } from './middlewares/cors.js';
import { conectarBD, sequelize } from './config/database.js';
import { createUsuariosrouter } from './routes/usuarios.js';
import { UsuarioModel, UsuarioSchema } from './models/usuarios.js';
import path from 'path';
import { createNegocioRouter } from './routes/negocios.js';
import { NegocioModel, NegocioSchema } from './models/negocios.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const multer = require('multer');
import { createAtencionClienteRouter } from './routes/atencion-cliente.js';
import { createHorarioRouter } from './routes/horario.js';
import { HorarioSchema, HorarioModel } from './models/horario.js';
import { ProductoSchema, ProductoModel } from './models/producto.js';
import { createProductoRouter } from './routes/producto.js';
import { createCategoriaRouter } from './routes/categoria.js';
import { CategoriaModel, CategoriaSchema } from './models/categoria.js';
import { AsistenteModel, AsistenteSchema } from './models/asistente.js';
import { createAsistenteRouter } from './routes/asistente.js';
import {
     RespuestaAsistenteModel,
     RespuestaAsistenteSchema,
} from './models/respuesta-asistente.js';
import { createRespuestaAsistenteRouter } from './routes/respuesta-asistente.js';
import {
     PreguntaAsistenteModel,
     PreguntaAsistenteSchema,
} from './models/preguntas-asistente.js';
import { createPreguntaAsistenteRouter } from './routes/pregunta-asistente.js';
import { createVariablePreguntaRouter } from './routes/variable_pregunta.js';
import {
     VariablePreguntaModel,
     VariablePreguntaSchema,
} from './models/variable-pregunta.js';
import { createTiendaRouter } from './routes/tienda.js';
import { TiendaModel, TiendaSchema } from './models/tienda.js';

import './models/relaciones-tablas.js';

const PORT = process.env.API_PORT ?? 3006;
const app = express();
app.disable('x-powered-by');
app.use(corsMiddleware());

const upload = multer({
     storage: multer.diskStorage({
          destination: (req, file, cb) => {
               cb(null, 'imagenes/');
          },
          filename: (req, file, cb) => {
               const imagen = Date.now() + '-' + file.originalname;
               req.body.nombre_imagen = imagen;
               cb(null, imagen);
          },
     }),
     limits: { fileSize: 5 * 1024 * 1024 },
});

const guardarArchivo = upload.single('imagen');

app.post('/subir-imagen', guardarArchivo, (req, res) => {
     return res.status(200).json({
          type: 'success',
          message: 'Imagen guardada en el servidor',
          nombre_imagen: req.body.nombre_imagen,
     });
});

app.use(json()); // para transformar el body de la request de JSON a objeto al hacer esto ya no se pueden procesar files

//Conexion a la BD
conectarBD();
sequelize
     .sync({ force: false })
     .then(() => console.log('✅ Tablas sincronizadas'))
     .catch((error) => console.error('❌ Error al sincronizar tablas:', error));

//Para saber cada vez que se reciba una solicitud en la API
app.use((req, res, next) => {
     console.log('request recibido el ', new Date().toString());
     next();
});

// para que se pueda acceder a la carpeta imagenes a traves de la URL
app.use(
     '/imagenes',
     express.static(path.join(process.env.URLBASE, 'imagenes'))
);

//basicamente en esta parte redirigimos todas las consultas de cualquier metodo a "/usuarios" al archivo usuariosRouter que ya maneja todas las solicitudes
app.use('/usuarios', createUsuariosrouter(UsuarioModel, UsuarioSchema));

//redirigimos todos lo que vena de negocios
app.use('/negocios', createNegocioRouter(NegocioModel, NegocioSchema));

//redireccion para todas las consultas hechas a la IA
app.use('/atencion-cliente', createAtencionClienteRouter());

//redireccion para todas las consultas con respecto al horario de los negocios
app.use('/horario', createHorarioRouter(HorarioModel, HorarioSchema));

//redireccion para todas las consuluta de los productos
app.use('/producto', createProductoRouter(ProductoModel, ProductoSchema));

//consultas con respecto a las categorias de productos
app.use('/categoria', createCategoriaRouter(CategoriaModel, CategoriaSchema));

//consultas con respecto a las categorias de productos
app.use('/asistente', createAsistenteRouter(AsistenteModel, AsistenteSchema));

//consultas con respecto a las respuestas del asistente
app.use(
     '/respuesta-asistente',
     createRespuestaAsistenteRouter(
          RespuestaAsistenteModel,
          RespuestaAsistenteSchema
     )
);

//consultas con respecto a las preguntas del asistente
app.use(
     '/pregunta-asistente',
     createPreguntaAsistenteRouter(
          PreguntaAsistenteModel,
          PreguntaAsistenteSchema
     )
);

//consultas con respecto a las categorias de productos
app.use(
     '/variable-pregunta',
     createVariablePreguntaRouter(VariablePreguntaModel, VariablePreguntaSchema)
);

//consultas con respecto a las categorias de productos
app.use('/tienda', createTiendaRouter(TiendaModel, TiendaSchema));

//Servidor escuchando la conexion
app.listen(PORT, () => {
     console.log(
          `El servidor esta escuchando las conexiones en http://localhost:${PORT}`
     );
});
