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
import { AlumnoModel, AlumnoSchema } from '../models/alumno.js';
import { TurnoCarreraSchema } from '../models/turno_carrera.js';
import { CarreraSchema } from '../models/carrera.js';
import { AnhoCarreraSchema } from '../models/anho_carrera.js';
import { CursoSchema } from '../models/curso.js';
import { NotaSchema } from '../models/nota.js';
import { MateriaSchema } from '../models/materia.js';
import { getIO } from '../socket/io.js';

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

               // await this.crearSessionEntities(
               //      sessionId,
               //      [
               //           { entityName: 'productoNombre', values: nombres },
               //           {
               //                entityName: 'productoCategoria',
               //                values: categoriasVariables,
               //           },
               //           { entityName: 'productoPrecio', values: precios },
               //      ],
               //      configAgente
               // );
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
               const outputContexts = req.body.queryResult.outputContexts;

               if (intencion === 'Solicita persona real') {
                    // 🔹 Extraer session completa (viene con prefijo de proyecto)
                    const fullSessionPath = req.body.session;

                    // 🔹 Si querés solo el ID "limpio" (sin el prefijo del proyecto)
                    const sessionID = fullSessionPath.split('/').pop();
                    const io = getIO();

                    io.to(sessionID).emit('chat:usarIA', { activo: false });
                    //REGISTRAR CONVERSACION PENDIENTE
                    await this.actualizarEstadoAsistente(
                         sessionID,
                         'Pendiente a asistir'
                    );
               }
               for (const [key, value] of Object.entries(parametros)) {
                    switch (key) {
                         case 'documentoAlumno':
                              const ciLimpio = value.replace(/\D/g, '');
                              const datosAlumno = await AlumnoSchema.findOne({
                                   where: { id_negocio, ci: ciLimpio },
                                   include: [
                                        {
                                             model: CursoSchema,
                                             as: 'curso',
                                             include: [
                                                  {
                                                       model: CarreraSchema,
                                                       as: 'carrera',
                                                  },
                                                  {
                                                       model: AnhoCarreraSchema,
                                                       as: 'anho_carrera',
                                                  },
                                                  {
                                                       model: TurnoCarreraSchema,
                                                       as: 'turno_carrera',
                                                  },
                                             ],
                                        },
                                        {
                                             model: NotaSchema,
                                             as: 'nota',
                                             include: [
                                                  {
                                                       model: MateriaSchema,
                                                       as: 'materia',
                                                  },
                                             ],
                                        },
                                   ],
                              });

                              const resumenEstados = {
                                   PENDIENTE: 0,
                                   'NO APROBADO': 0,
                                   APROBADO: 0,
                              };

                              if (datosAlumno) {
                                   let totalNotas = 0;
                                   let cantidadMaterias = 0;
                                   for (const nota of datosAlumno.nota || []) {
                                        if (
                                             resumenEstados.hasOwnProperty(
                                                  nota.estado
                                             )
                                        ) {
                                             resumenEstados[nota.estado]++;
                                             totalNotas += nota.nota;
                                             if (nota.estado !== 'PENDIENTE') {
                                                  cantidadMaterias++;
                                             }
                                        }
                                   }
                                   const promedioNota =
                                        totalNotas / cantidadMaterias;

                                   const datosAlumnoFormateado = {
                                        nombreAlumno: datosAlumno.nombre_alumno,
                                        carreraAlumno:
                                             datosAlumno.curso.carrera
                                                  .nombre_carrera,
                                        turnoAlumno:
                                             datosAlumno.curso.turno_carrera
                                                  .denominacion,
                                        anhoCursadoAlumno:
                                             datosAlumno.curso.anho_carrera
                                                  .denominacion,
                                        ultimaCuotaPendienteAlumno:
                                             datosAlumno.ultima_cuota_pendiente,
                                        ultimaCuotaPagadaAlumno:
                                             datosAlumno.ultima_cuota_pagada,
                                        montoCuotaPendienteAlumno:
                                             datosAlumno.monto_ultima_cuota_pendiente,
                                        horasCapacitacionAlumno:
                                             datosAlumno.horas_capacitacion,
                                        horaCapacitacionFaltanteAlumno:
                                             datosAlumno.horas_capacitacion_faltantes,
                                        horasExtensionAlumno:
                                             datosAlumno.horas_extension,
                                        horasExtensionFaltantesAlumno:
                                             datosAlumno.horas_extension_faltantes,
                                        cursoAlumno:
                                             datosAlumno.curso.nombre_curso,
                                        cuotaCurso:
                                             datosAlumno.curso.mensualidad,
                                        matriculaCurso:
                                             datosAlumno.curso.matricula,
                                        notasAlumno: this.transformarNotas(
                                             datosAlumno.nota
                                        ),
                                        materiasAprobadasAlumno:
                                             resumenEstados.APROBADO,
                                        materiasNoAprobadasAlumno:
                                             resumenEstados['NO APROBADO'],
                                        materiasPendientesAlumno:
                                             resumenEstados.PENDIENTE,
                                        promedioNotasAlumno: promedioNota,
                                        totalNotasAlumnos: totalNotas,
                                   };

                                   for (const [campo, valor] of Object.entries(
                                        datosAlumnoFormateado
                                   )) {
                                        this.sobreEscribirContexto(
                                             outputContexts,
                                             {
                                                  name: `${req.body.session}/contexts/${campo}`,
                                                  lifespanCount: 40,
                                                  parameters: {
                                                       [campo]: valor,
                                                  },
                                             }
                                        );
                                   }
                              } else {
                                   return res.json({
                                        fulfillmentText: `Lo siento pero el alumno con documento ${ciLimpio} no se encuentra matriculado en el año`,
                                   });
                              }

                              break;
                         case 'carreraAlumno':
                              const carreraUsuario = value
                                   ?.toLowerCase()
                                   .trim();

                              const carreras = await CarreraSchema.findAll({
                                   where: { id_negocio },
                                   raw: true,
                              });

                              let carreraCoincidente = null;

                              for (const carrera of carreras) {
                                   const nombre =
                                        carrera.nombre_carrera.toLowerCase();
                                   const abreviatura =
                                        carrera.abreviatura?.toLowerCase() ??
                                        '';
                                   const otros = (
                                        carrera.otro_nombre || []
                                   ).map((n) => n.toLowerCase());

                                   if (
                                        nombre.includes(carreraUsuario) ||
                                        abreviatura.includes(carreraUsuario) ||
                                        otros.some((n) =>
                                             n.includes(carreraUsuario)
                                        )
                                   ) {
                                        carreraCoincidente = carrera;
                                        break;
                                   }
                              }

                              if (carreraCoincidente) {
                                   this.sobreEscribirContexto(outputContexts, {
                                        name: `${req.body.session}/contexts/carreraAlumno`,
                                        lifespanCount: 40,
                                        parameters: {
                                             carreraAlumno:
                                                  carreraCoincidente.nombre_carrera,
                                             idCarrera:
                                                  carreraCoincidente.id_carrera,
                                        },
                                   });
                                   this.sobreEscribirContexto(outputContexts, {
                                        name: `${req.body.session}/contexts/idCarreraAlumno`,
                                        lifespanCount: 40,
                                        parameters: {
                                             idCarreraAlumno:
                                                  carreraCoincidente.id_carrera,
                                        },
                                   });
                              }

                              break;

                         case 'turnoAlumno':
                              const turnoUsuario = value?.toLowerCase().trim();

                              const turnos = await TurnoCarreraSchema.findAll({
                                   where: { id_negocio },
                                   raw: true,
                              });

                              let turnoCoincidente = null;

                              for (const turno of turnos) {
                                   const nombre =
                                        turno.denominacion.toLowerCase();
                                   const abreviatura =
                                        turno.abreviatura?.toLowerCase() ?? '';
                                   const otros = (
                                        turno.otra_denominacion || []
                                   ).map((n) => n.toLowerCase());

                                   if (
                                        nombre.includes(turnoUsuario) ||
                                        abreviatura.includes(turnoUsuario) ||
                                        otros.some((n) =>
                                             n.includes(turnoUsuario)
                                        )
                                   ) {
                                        turnoCoincidente = turno;
                                        break;
                                   }
                              }

                              if (turnoCoincidente) {
                                   this.sobreEscribirContexto(outputContexts, {
                                        name: `${req.body.session}/contexts/turnoAlumno`,
                                        lifespanCount: 40,
                                        parameters: {
                                             turnoAlumno:
                                                  turnoCoincidente.denominacion,
                                             idTurno: turnoCoincidente.id_turno_carrera,
                                        },
                                   });
                                   this.sobreEscribirContexto(outputContexts, {
                                        name: `${req.body.session}/contexts/idTurnoAlumno`,
                                        lifespanCount: 40,
                                        parameters: {
                                             idTurnoAlumno:
                                                  turnoCoincidente.id_turno_carrera,
                                        },
                                   });
                              }

                              break;

                         case 'anhoCursadoAlumno':
                              const anhoCursadoUsuario = value
                                   ?.toLowerCase()
                                   .trim();

                              const anhosCursado =
                                   await AnhoCarreraSchema.findAll({
                                        where: { id_negocio },
                                        raw: true,
                                   });

                              let anhoCursadoCoincidente = null;

                              for (const anhoCursado of anhosCursado) {
                                   const nombre =
                                        anhoCursado.denominacion.toLowerCase();
                                   const abreviatura =
                                        anhoCursado.abreviatura?.toLowerCase() ??
                                        '';
                                   const otros = (
                                        anhoCursado.otra_denominacion || []
                                   ).map((n) => n.toLowerCase());

                                   if (
                                        nombre.includes(anhoCursadoUsuario) ||
                                        abreviatura.includes(
                                             anhoCursadoUsuario
                                        ) ||
                                        otros.some((n) =>
                                             n.includes(anhoCursadoUsuario)
                                        )
                                   ) {
                                        anhoCursadoCoincidente = anhoCursado;
                                        break;
                                   }
                              }

                              if (anhoCursadoCoincidente) {
                                   this.sobreEscribirContexto(outputContexts, {
                                        name: `${req.body.session}/contexts/anhoCursadoAlumno`,
                                        lifespanCount: 40,
                                        parameters: {
                                             anhoCursadoAlumno:
                                                  anhoCursadoCoincidente.denominacion,
                                        },
                                   });
                                   this.sobreEscribirContexto(outputContexts, {
                                        name: `${req.body.session}/contexts/idAnhoCursadoAlumno`,
                                        lifespanCount: 40,
                                        parameters: {
                                             idAnhoCursadoAlumno:
                                                  turnoCoincidente.id_anho_carrera,
                                        },
                                   });
                              }

                              break;
                    }
               }

               const negocio = await NegocioSchema.findOne({
                    where: { id_negocio },
               });

               if (!negocio) {
                    return res.json({
                         fulfillmentText:
                              'No se encontró información del negocio.',
                    });
               }

               // Función auxiliar para obtener un parámetro de contexto fácilmente
               const getParametroContexto = (nombreParametro) => {
                    for (const ctx of outputContexts) {
                         if (
                              ctx.parameters &&
                              ctx.parameters[nombreParametro] !== undefined
                         ) {
                              return ctx.parameters[nombreParametro];
                         }
                    }
                    return null;
               };

               // Buscar los tres valores
               const idCarreraAlumno = getParametroContexto('idCarreraAlumno');
               const idTurnoAlumno = getParametroContexto('idTurnoAlumno');
               const idAnhoCursadoAlumno = getParametroContexto(
                    'idAnhoCursadoAlumno'
               );

               // Verificar si existen y ejecutar una acción
               if (idCarreraAlumno && idTurnoAlumno && idAnhoCursadoAlumno) {
                    const cursoConsultado = await CursoSchema.findAll({
                         where: {
                              id_negocio,
                              id_anho: idAnhoCursadoAlumno,
                              id_carrera: idCarreraAlumno,
                              id_turno: idTurnoAlumno,
                         },
                         raw: true,
                    });
                    if (cursoConsultado) {
                         this.sobreEscribirContexto(outputContexts, {
                              name: `${req.body.session}/contexts/cursoAlumno`,
                              lifespanCount: 40,
                              parameters: {
                                   cursoAlumno: cursoConsultado.nombre_curso,
                              },
                         });
                         this.sobreEscribirContexto(outputContexts, {
                              name: `${req.body.session}/contexts/cuotaCurso`,
                              lifespanCount: 40,
                              parameters: {
                                   cuotaCurso: cursoConsultado.mensualidad,
                              },
                         });
                         this.sobreEscribirContexto(outputContexts, {
                              name: `${req.body.session}/contexts/matriculaCurso`,
                              lifespanCount: 40,
                              parameters: {
                                   cuotaCurso: cursoConsultado.matricula,
                              },
                         });
                    }
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
                                   lifespanCount: 40,
                                   parameters: {
                                        [v.nombre_variable_pregunta]: valor,
                                   },
                              });
                         }
                    }

                    for (const v of variables) {
                         if (
                              pregunta.variables_respuesta.includes(
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
                                        // 1️⃣ Intentamos obtener del parámetro actual
                                        valor =
                                             parametros?.[
                                                  v.nombre_variable_pregunta
                                             ];

                                        // 2️⃣ Si no vino en esta consulta, buscamos en los contextos
                                        if (valor == null) {
                                             valor =
                                                  this.getValorDesdeContextos(
                                                       req.body.queryResult
                                                            .outputContexts ||
                                                            [],
                                                       v.nombre_variable_pregunta
                                                  );
                                        }
                                        break;

                                   case 'valor_fijo':
                                        // Se usa el valor que ya está en BD
                                        valor = v.valor_respuesta;
                                        break;
                              }

                              outputContexts.push({
                                   name: `${req.body.session}/contexts/${v.nombre_variable_pregunta}`,
                                   lifespanCount: 40,
                                   parameters: {
                                        [v.nombre_variable_pregunta]: valor,
                                   },
                              });
                         }
                    }

                    const datosNegocio = {};

                    for (const ctx of outputContexts) {
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
                    fulfillmentText:
                         'Disculpe pero ocurrio un error interno del servidor al intentar responder su consulta. Por favor, intente de nuevo más tarde.',
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

     sobreEscribirContexto(outputContexts, nuevoValor) {
          const index = outputContexts.findIndex(
               (ctx) => ctx.name === nuevoValor.name
          );
          if (index !== -1) {
               outputContexts[index] = nuevoValor; // 🔁 Sobrescribe el existente
          } else {
               outputContexts.push(nuevoValor); // ➕ Agrega si no existe
          }
     }

     getValorDesdeContextos(outputContexts, nombreVariable) {
          for (const ctx of outputContexts) {
               if (
                    ctx.parameters &&
                    ctx.parameters[nombreVariable] !== undefined
               ) {
                    return ctx.parameters[nombreVariable];
               }
          }
          return null;
     }
     transformarNotas(notas) {
          if (!notas || notas.length === 0) return 'No hay notas registradas.';

          // Iteramos sobre cada nota y formateamos "Materia - Nota"
          return notas
               .map(
                    (n) =>
                         `Materia: ${n.materia.nombre_materia}, nota: ${n.nota}, estado: ${n.estado}`
               )
               .join('<br>'); // <-- aquí agregamos los saltos de línea
     }

     async actualizarEstadoAsistente(sessionID, nuevoEstado) {
          try {
               await HistorialConversacionSchema.update(
                    { estado: nuevoEstado },
                    { where: { sesion: sessionID } }
               );
          } catch (error) {
               console.error(
                    'Error al actualizar el estado del asistente:',
                    error,
                    ' ID  de la sesion : ',
                    sessionID,
                    ' Estado a cambiar: ',
                    nuevoEstado
               );
          }
     }
}
export const atencionClienteController = new AtencionClienteController();
