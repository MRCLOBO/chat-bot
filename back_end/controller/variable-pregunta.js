import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';
import { AsistenteSchema } from '../models/asistente.js';
import { RespuestaAsistenteSchema } from '../models/respuesta-asistente.js';
import { createRequire } from 'module';
import { sequelize } from '../config/database.js';
const require = createRequire(import.meta.url);
const { EntityTypesClient } = require('@google-cloud/dialogflow');

export class VariablePreguntaController {
     constructor(variablePreguntaModel, variablePreguntaSchema) {
          this.variablePreguntaModel = variablePreguntaModel;
          this.variablePreguntaSchema = variablePreguntaSchema;
     }

     setCurrentUser = async (usuario) => {
          if (!usuario) return;
          await sequelize.query(`SET "app.current_user" = '${usuario}'`);
     };

     getAll = async (req, res) => {
          const variablePregunta = await this.variablePreguntaSchema.findAll();
          return res.status(200).json(variablePregunta);
     };

     create = async (req, res) => {
          try {
               const usuarioAuditoria = req.headers['x-apodo'] || 'desconocido';
               this.setCurrentUser(usuarioAuditoria);
               const nuevaVariablePregunta = req.body;
               nuevaVariablePregunta['id_variable_pregunta'] =
                    await this.obtenerUltimoID();

               /**
                * PRIMERO SE CREA LA VARIABLE EN DIALOGFLOW, SI NO TIENE EXITO NO SE REGISTRA EN EL SISTEMA
                */
               await this.crearEntityDialogflow(
                    nuevaVariablePregunta.id_negocio,
                    nuevaVariablePregunta
               );

               const respuestaBD = await this.variablePreguntaSchema.create(
                    nuevaVariablePregunta
               );
               return res.status(200).json({
                    type: 'success',
                    message: 'Variable de pregunta creada con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear la variable de pregunta por el siguiente error: ${error}`,
               });
               console.error(error);
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];
               // Filtro LIKE para 'nombre'
               if (filtros.nombre_variable) {
                    condiciones.push({
                         nombre_variable: {
                              [Op.like]: `%${filtros.nombre_variable}%`,
                         },
                    });
                    delete filtros.nombre_variable;
               }
               // Extraer los valores de ordenamiento y eliminarlos del objeto de filtros
               const campoOrden = filtros.orden;
               const tipoOrden = filtros.tipo_orden;
               delete filtros.orden;
               delete filtros.tipo_orden;
               // Resto de filtros exactos
               let idNegocio = '';
               if (filtros.id_negocio) {
                    idNegocio = filtros.id_negocio;
                    delete filtros.id_negocio;
               }
               for (const key in filtros) {
                    condiciones.push({ [key]: filtros[key] });
               }
               // Armar la consulta con ordenamiento si aplica
               const opcionesConsulta = {
                    where: { [Op.and]: condiciones },
               };
               if (campoOrden && tipoOrden) {
                    opcionesConsulta.order = [[campoOrden, tipoOrden]];
               }

               const variablePregunta =
                    await this.variablePreguntaSchema.findAll({
                         ...opcionesConsulta,
                         // include: [
                         //      {
                         //           model: RespuestaAsistenteSchema,
                         //           as: 'respuestas',
                         //           where: idNegocio
                         //                ? { id_negocio: idNegocio }
                         //                : undefined,
                         //           required: false,
                         //      },
                         // ],
                    });
               return res.status(200).json(variablePregunta);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar las variables de pregunta: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const usuarioAuditoria = req.headers['x-apodo'] || 'desconocido';
               this.setCurrentUser(usuarioAuditoria);
               const variablePregunta = await this.getVariablePregunta(
                    req.body
               );

               // 🔐 Obtener las credenciales del negocio
               const negocio = await NegocioSchema.findOne({
                    where: { id_negocio: variablePregunta.id_negocio },
               });

               if (!negocio || !negocio.api_key) {
                    return res.status(404).json({
                         type: 'error',
                         message: 'Credenciales del negocio no encontradas',
                    });
               }

               const CREDENTIALS = JSON.parse(negocio.api_key);
               const projectId = CREDENTIALS.project_id;

               const client = new EntityTypesClient({
                    credentials: {
                         private_key: CREDENTIALS.private_key,
                         client_email: CREDENTIALS.client_email,
                    },
               });

               // 📌 Buscar la entity por su displayName
               const [entities] = await client.listEntityTypes({
                    parent: `projects/${projectId}/agent`,
               });

               const entityActual = entities.find(
                    (e) =>
                         e.displayName ===
                         variablePregunta.nombre_variable_pregunta
               );

               if (!entityActual) {
                    return res.status(404).json({
                         type: 'error',
                         message: 'La entidad no fue encontrada en Dialogflow',
                    });
               }

               // 🗑️ Eliminar de Dialogflow
               await client.deleteEntityType({ name: entityActual.name });

               // ✅ Si todo salió bien, eliminar de tu base de datos
               await variablePregunta.destroy();

               return res.json({
                    type: 'success',
                    message: 'Variable de pregunta eliminada correctamente en el sistema y Dialogflow',
               });
          } catch (error) {
               console.error(
                    'Error al eliminar la entity o la variable:',
                    error
               );
               return res.status(500).json({
                    type: 'error',
                    message: 'Ocurrió un error al intentar eliminar la variable',
               });
          }
     };

     update = async (req, res) => {
          try {
               const usuarioAuditoria = req.headers['x-apodo'] || 'desconocido';
               this.setCurrentUser(usuarioAuditoria);
               const variablePregunta = await this.getVariablePregunta(
                    req.body
               );
               const filtros = await this.limpiarCampos(req.body);
               delete filtros.id_variable_pregunta;

               // 🔐 Obtener credenciales del negocio
               const negocio = await NegocioSchema.findOne({
                    where: { id_negocio: filtros.id_negocio },
               });
               const CREDENTIALS = JSON.parse(negocio.api_key);
               const projectId = CREDENTIALS.project_id;

               const client = new EntityTypesClient({
                    credentials: {
                         private_key: CREDENTIALS.private_key,
                         client_email: CREDENTIALS.client_email,
                    },
               });

               // 📌 Obtener la entity actual desde Dialogflow
               const [entities] = await client.listEntityTypes({
                    parent: `projects/${projectId}/agent`,
               });

               const entityActual = entities.find(
                    (e) => e.displayName === filtros.nombre_variable_pregunta
               );

               if (!entityActual) {
                    return res.status(404).json({
                         type: 'error',
                         message: 'La entidad no fue encontrada en Dialogflow',
                    });
               }

               // 🔄 Armá el objeto actualizado
               const entityUpdate = {
                    name: entityActual.name,
                    displayName: filtros.nombre_variable_pregunta,
                    kind: 'KIND_MAP',
                    enableFuzzyExtraction: true,
                    entities: filtros.valores.map((valor) => ({
                         value: valor,
                         synonyms: [valor], // o múltiples sinónimos si tenés
                    })),
               };

               // 📤 Enviá el update a Dialogflow
               await client.updateEntityType({
                    entityType: entityUpdate,
                    updateMask: {
                         paths: ['entities', 'enableFuzzyExtraction'],
                    },
               });

               const resultado = await this.variablePreguntaSchema.update(
                    filtros,
                    {
                         where: {
                              id_variable_pregunta:
                                   variablePregunta.id_variable_pregunta,
                         },
                    }
               );
               return res.json({
                    type: 'success',
                    message: 'Variable de pregunta modificado',
               });
          } catch (error) {
               console.error(error);
               return res.json({
                    type: 'error',
                    message: 'Error al modificar la variable de pregunta',
               });
          }
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }

     async getVariablePregunta(filtros) {
          try {
               // Se busca el asistente por su id y id_negocio por la primary key compuesta
               const variablePregunta =
                    await this.variablePreguntaSchema.findOne({
                         where: {
                              id_variable_pregunta:
                                   filtros.id_variable_pregunta,
                         },
                    });
               if (!variablePregunta)
                    return {
                         type: 'error',
                         message: 'Variable de pregunta no encontrado',
                    };
               return variablePregunta;
          } catch (error) {
               return {
                    type: 'error',
                    message: `Variable de pregunta no encontrado`,
               };
          }
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro = await this.variablePreguntaSchema.findOne(
                    {
                         order: [['id_variable_pregunta', 'DESC']],
                    }
               );
               if (ultimoRegistro) {
                    return ultimoRegistro.id_variable_pregunta + 1;
               } else {
                    return 1;
               }
          } catch (error) {
               return {
                    type: 'error',
                    message: 'Error al recuperar el ultimo ID de la tabla',
               };
          }
     }
     async crearEntityDialogflow(id_negocio, entityLocal) {
          // 1. Obtener las credenciales del negocio
          const negocio = await NegocioSchema.findOne({
               where: { id_negocio: id_negocio },
          });

          if (!negocio || !negocio.api_key) {
               throw new Error('Credenciales no encontradas');
          }

          const credentials = JSON.parse(negocio.api_key);
          const projectId = credentials.project_id;

          const client = new EntityTypesClient({
               credentials: {
                    private_key: credentials.private_key,
                    client_email: credentials.client_email,
               },
          });

          const agentPath = client.projectAgentPath(projectId);

          // 2. Crear la entity con fuzzy matching
          const request = {
               parent: agentPath,
               entityType: {
                    displayName: entityLocal.nombre_variable_pregunta, // Ej: "producto"
                    kind: 'KIND_MAP', // también puede ser KIND_LIST o KIND_REGEXP
                    enableFuzzyExtraction: true, // <-- Esto activa fuzzy matching
                    entities: (entityLocal.valores || []).map((valor) => ({
                         value: valor,
                         synonyms: [valor], // Podés incluir más sinónimos
                    })),
               },
          };

          const [response] = await client.createEntityType(request);
          console.log('Entidad creada en Dialogflow:', response.name);
          return response;
     }
}
