import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dialogflow = require('@google-cloud/dialogflow');
require('dotenv').config();
import { HorarioSchema } from '../models/horario.js';
import { ProductoSchema } from '../models/producto.js';
import { NegocioSchema } from '../models/negocios.js';
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
import { Sequelize, DataTypes, Op, where, fn, col } from 'sequelize';
import { PreguntaAsistenteSchema } from '../models/preguntas-asistente.js';
import { RespuestaAsistenteSchema } from '../models/respuesta-asistente.js';
import { CategoriaSchema } from '../models/categoria.js';
import { HistorialConversacionSchema } from '../models/historial-conversacion.js';
import { VariablePreguntaSchema } from '../models/variable-pregunta.js';

export class AtencionClienteController {
     detectIntent = async (
          languageCode,
          queryText,
          sessionId,
          infoAsistente,
          esInicioConversacion = false
     ) => {
          const configAgente = await NegocioSchema.findOne({
               where: { id_negocio: infoAsistente.id_negocio },
          });

          if (!configAgente || !configAgente.api_key) {
               throw new Error(
                    'Credenciales de Dialogflow no encontradas para este negocio'
               );
          }

          const CREDENTIALS = JSON.parse(configAgente.api_key);

          const CONFIGURATION = {
               credentials: {
                    private_key: CREDENTIALS['private_key'],
                    client_email: CREDENTIALS['client_email'],
               },
          };

          const PROJECTID = CREDENTIALS.project_id;

          const sessionClient = new dialogflow.SessionsClient(CONFIGURATION);

          const sessionPath = sessionClient.projectAgentSessionPath(
               PROJECTID,
               sessionId
          );

          // 👉 Solo si es el primer mensaje: crear entidades
          if (esInicioConversacion) {
               const productos = await ProductoSchema.findAll({
                    attributes: ['nombre_producto', 'precio'],
                    where: { id_negocio: infoAsistente.id_negocio },
               });

               const categorias = await CategoriaSchema.findAll({
                    attributes: ['nombre_categoria'],
                    where: { id_negocio: infoAsistente.id_negocio },
               });

               const nombres = [
                    ...new Set(productos.map((p) => p.nombre_producto)),
               ];
               const precios = [
                    ...new Set(productos.map((p) => p.precio.toString())),
               ];
               const categoriasVariables = [
                    ...new Set(categorias.map((c) => c.nombre_categoria)),
               ];

               await this.crearSessionEntities(
                    sessionId,
                    [
                         { entityName: 'productoNombre', values: nombres },
                         {
                              entityName: 'productoCategoria',
                              values: categoriasVariables,
                         },
                         { entityName: 'productoPrecio', values: precios },
                    ],
                    configAgente
               );
          }

          const request = {
               session: sessionPath,
               queryInput: {
                    text: {
                         text: queryText,
                         languageCode: languageCode,
                    },
               },
               queryParams: {
                    payload: {
                         fields: {
                              infoAsistente: {
                                   structValue: {
                                        fields: {
                                             id_negocio: {
                                                  numberValue:
                                                       infoAsistente.id_negocio,
                                             },
                                        },
                                   },
                              },
                         },
                    },
               },
          };

          const responses = await sessionClient.detectIntent(request);
          const result = responses[0].queryResult;

          return {
               response: result.fulfillmentText,
          };
     };
     consulta = async (consulta) => {
          try {
               const {
                    sessionID,
                    consultaUsuario,
                    infoAsistente,
                    esInicioConversacion,
               } = consulta;

               const datosMensaje = {
                    sesion: sessionID,
                    id_negocio: infoAsistente.id_negocio,
                    remitente: 'cliente',
                    mensaje: consultaUsuario,
                    fecha_mensaje: new Date(),
               };
               await this.registrarMensaje(datosMensaje);
               const respuestaBOT = await this.detectIntent(
                    'es',
                    consultaUsuario,
                    sessionID,
                    infoAsistente,
                    esInicioConversacion // esto es importante
               );
               const datosRespuesta = {
                    sesion: sessionID,
                    id_negocio: infoAsistente.id_negocio,
                    remitente: 'asistente',
                    mensaje: respuestaBOT.response,
                    fecha_mensaje: new Date(),
               };
               await this.registrarMensaje(datosRespuesta);
               return {
                    type: 'success',
                    message: 'consulta exitosa',
                    respuestaBOT: respuestaBOT.response,
               };
          } catch (error) {
               console.log(
                    '###Ocurrió un error al hacer la consulta al chatbot###',
                    error,
                    '################################'
               );
               return {
                    type: 'error',
                    message: 'Ocurrió un error en el servidor, por favor intentelo de nuevo más tarde',
               };
          }
     };

     webhook = async (req, res) => {
          try {
               const infoAsistente =
                    req.body.originalDetectIntentRequest.payload?.infoAsistente;
               const id_negocio = infoAsistente?.id_negocio;
               const intencion = req.body.queryResult.intent.displayName;
               let respuesta = '';
               const parametros = req.body.queryResult.parameters || {};
               // const nombreProducto = parametros?.productoNombre;
               // const precioProducto = Number(parametros?.productoPrecio);
               // const categoriaProducto = parametros?.productoCategoria;

               console.log(
                    'VALOR COMPLETO DE LA CONSULTA ',
                    req.body.queryResult
               );
               const negocio = await NegocioSchema.findOne({
                    where: { id_negocio },
               });

               if (!negocio) {
                    return res.json({
                         fulfillmentText:
                              'No se encontró información del negocio.',
                    });
               }
               /**
                * Si mi intencion no es la generica buscara la respuesta en base a este, sino, lo buscara por pregunta ya que es un intento personalizado
                */
               try {
                    const pregunta = await PreguntaAsistenteSchema.findOne({
                         where: { intencion: intencion },
                    });

                    if (!pregunta) {
                         return res.json({
                              fulfillmentText:
                                   'Lo siento, no entendi muy bien tu consulta. Me podrias especificar mas, por favor.',
                         });
                    }

                    // Buscar variables definidas para este negocio
                    const variables = await VariablePreguntaSchema.findAll({
                         where: { id_negocio },
                    });

                    const outputContexts = [];

                    // Recorrer variables asociadas a la pregunta
                    for (const v of variables) {
                         if (
                              pregunta.variables_pregunta.includes(
                                   v.nombre_variable_pregunta
                              )
                         ) {
                              let valor = null;
                              switch (v.tipo_respuesta) {
                                   case 'sin_valor':
                                        // Se deja nulo o vacío, se completará en otra interacción
                                        valor = null;
                                        break;

                                   case 'valor_parametro':
                                        // Si el usuario pasó el parámetro en esta consulta, lo usamos
                                        // Ej: { cedulaCliente: "123456" }
                                        valor =
                                             parametros?.[
                                                  v.nombre_variable_pregunta
                                             ] ?? null;
                                        break;

                                   case 'valor_fijo':
                                        // Se usa el valor que ya está en BD
                                        valor = v.valor_respuesta;
                                        break;
                              }

                              outputContexts.push({
                                   name: `${req.body.session}/contexts/${v.nombre_variable_pregunta}`,
                                   lifespanCount: 25,
                                   parameters: {
                                        [v.nombre_variable_pregunta]: valor,
                                   },
                              });
                         }
                    }

                    const datosNegocio = {};

                    // 2) Agregar variables de los contextos activos
                    const inputContexts =
                         req.body.queryResult.outputContexts || [];
                    for (const ctx of inputContexts) {
                         if (ctx.parameters) {
                              for (const [key, value] of Object.entries(
                                   ctx.parameters
                              )) {
                                   if (
                                        value !== null &&
                                        value !== undefined &&
                                        value !== ''
                                   ) {
                                        datosNegocio[key] = value;
                                   }
                              }
                         }
                    }
                    respuesta = this.renderTemplate(
                         pregunta.respuesta,
                         datosNegocio
                    );

                    // if (intencion !== 'Consultar Producto') {
                    //      const pregunta = await PreguntaAsistenteSchema.findOne(
                    //           {
                    //                where: { intencion: intencion },
                    //           }
                    //      );

                    //      if (!pregunta) {
                    //           return res.json({
                    //                fulfillmentText:
                    //                     'Lo siento, no entendi muy bien tu consulta. Me lo podrias especificar, por favor.',
                    //           });
                    //      }
                    //      let producto;
                    //      const where = {
                    //           id_negocio: infoAsistente.id_negocio, // obligatorio
                    //      };

                    //      if (nombreProducto) {
                    //           where.nombre_producto = {
                    //                [Op.iLike]: `%${nombreProducto}%`,
                    //           };
                    //      }

                    //      if (precioProducto) {
                    //           where.precio = precioProducto; // o podés convertir a número si viene como string
                    //      }

                    //      // Acá necesitás incluir la categoría relacionada y filtrar por su nombre
                    //      const includeCategoria = {
                    //           model: CategoriaSchema,
                    //           as: 'categoria',
                    //           attributes: ['nombre_categoria'],
                    //           ...(categoriaProducto && {
                    //                where: {
                    //                     nombre_categoria: {
                    //                          [Op.iLike]: `%${categoriaProducto}%`,
                    //                     },
                    //                },
                    //           }),
                    //      };

                    //      if (
                    //           nombreProducto ||
                    //           categoriaProducto ||
                    //           precioProducto
                    //      ) {
                    //           producto = await ProductoSchema.findOne({
                    //                where,
                    //                include: [includeCategoria],
                    //                raw: true,
                    //           });

                    //           if (!producto) {
                    //                return res.json({
                    //                     fulfillmentText: `Lo siento, no tenemos el articulo que deseas.Si necesitas algun otro articulo puedes decirmelo'.`,
                    //                });
                    //           }
                    //           if (producto.cantidad < 1) {
                    //                return res.json({
                    //                     fulfillmentText: `Lo siento, ya no tenemos stock de '${nombreProducto}' si necesitas algun otro articulo puedes decirmelo'.`,
                    //                });
                    //           }
                    //      }

                    //      const datosNegocio = {
                    //           productoNombre: producto?.nombre_producto,
                    //           productoCategoria:
                    //                producto?.categoria?.nombre_categoria,
                    //           productoPrecio: producto?.precio,
                    //           productoCantidad: producto?.cantidad,
                    //           nombreNegocio: negocio.nombre_negocio,
                    //           direccionNegocio: negocio.direccion,
                    //           correoNegocio: negocio.email,
                    //           propietarioNegocio: negocio.propietario,
                    //           telefonoNegocio: negocio.telefono,
                    //      };
                    //      respuesta = this.renderTemplate(
                    //           pregunta.respuesta,
                    //           datosNegocio
                    //      );
                    // }
                    if (intencion === 'Default Fallback Intent') {
                         respuesta = `Disculpa, no entendi muy bien tu consulta ¿Podrias ser mas especifico?`;
                    }

                    return res.json({
                         fulfillmentText: respuesta,

                         outputContexts,
                    });
               } catch (error) {
                    console.error(
                         `OCURRIO UN ERROR EN LA CONSULTA DEL CHATBOT`,
                         error
                    );
                    return res.json({
                         fulfillmentText:
                              'Disculpe pero ocurrio un error interno del servidor al intentar responder su consulta. Por favor, intente de nuevo más tarde.',
                    });
               }
          } catch (error) {
               console.log(
                    '###Ocurrio un error al responder la consulta del chatbot###',
                    error,
                    '################################'
               );
               return res.json({
                    type: 'error',
                    message: 'Ocurrio un error en el servidor, por favor intentelo de nuevo mas tarde',
               });
          }
     };

     buscarDisponibilidadProducto = async (nombre, id_negocio) => {
          try {
               console.log('#####NOMBRE DEL PRODUCTO CONSULTADO##### ', nombre);
               const productos = await ProductoSchema.findAll({
                    where: {
                         nombre_producto: {
                              [Op.like]: `%${nombre}%`,
                         },
                         id_negocio,
                    },
                    order: [['consultas', 'DESC']],
                    limit: 3,
               });

               if (productos.length === 0) {
                    return `Lo siento... actualmente no contamos con el articulo '${nombre}', ¿Tienes algun otro articulo de interes?`;
               }

               const producto = productos[0]; // el más consultado

               let mensaje = '';

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
               console.error('Error al buscar disponibilidad:', err);
               return 'Hubo un problema al consultar la disponibilidad del producto.';
          }
     };
     formatearGs = (monto) => {
          return new Intl.NumberFormat('es-PY', {
               style: 'currency',
               currency: 'PYG',
               minimumFractionDigits: 0, // Guaraníes no usan decimales normalmente
          }).format(monto);
     };

     renderTemplate(template, datos) {
          return template.replace(/\{\s*([\w.]+)\s*\}/g, (_, path) => {
               const value = path.split('.').reduce((obj, key) => {
                    return obj?.[key];
               }, datos);
               return value !== undefined ? value : `{${path}}`; // si no encuentra, deja el placeholder
          });
     }

     async crearSessionEntities(sessionID, entidades, configAgente) {
          if (!configAgente || !configAgente.api_key) {
               throw new Error('Credenciales de Dialogflow no encontradas');
          }

          const CREDENTIALS = JSON.parse(configAgente.api_key);

          const CONFIGURATION = {
               credentials: {
                    private_key: CREDENTIALS.private_key,
                    client_email: CREDENTIALS.client_email,
               },
          };

          const client = new dialogflow.SessionEntityTypesClient(CONFIGURATION);

          const sessionPath = client.projectAgentSessionPath(
               CREDENTIALS.project_id,
               sessionID
          );

          const requests = entidades.map(({ entityName, values }) => ({
               parent: sessionPath,
               sessionEntityType: {
                    name: `${sessionPath}/entityTypes/${entityName}`,
                    entityOverrideMode: 'ENTITY_OVERRIDE_MODE_SUPPLEMENT',
                    entities: values.map((v) => ({
                         value: v,
                         synonyms: [v],
                    })),
               },
          }));

          // Crear todas las session entities en paralelo
          await Promise.all(
               requests.map((r) => client.createSessionEntityType(r))
          );
     }

     async registrarMensaje(infoMensaje) {
          try {
               let ultimoRegistro = await HistorialConversacionSchema.findOne({
                    order: [['id_historial_conversacion', 'DESC']],
               });
               if (ultimoRegistro) {
                    infoMensaje['id_historial_conversacion'] =
                         ultimoRegistro.id_historial_conversacion + 1;
               } else {
                    infoMensaje['id_historial_conversacion'] = 1;
               }

               await HistorialConversacionSchema.create(infoMensaje);
          } catch (error) {
               console.error(
                    `### Ocurrio un error al registrar el mensaje, info error : ${error} ;;;; informacion del mensaje : ${infoMensaje} ;;;;`
               );
          }
     }
}
export const atencionClienteController = new AtencionClienteController();
