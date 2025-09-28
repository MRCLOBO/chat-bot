import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';
import { AsistenteSchema } from '../models/asistente.js';
import { RespuestaAsistenteSchema } from '../models/respuesta-asistente.js';
import { VariablePreguntaSchema } from '../models/variable-pregunta.js';
import { IntentsClient } from '@google-cloud/dialogflow'; // Asegurate de importar esto

export class PreguntaAsistenteController {
     constructor(preguntaAsistenteModel, preguntaAsistenteSchema) {
          this.preguntaAsistenteModel = preguntaAsistenteModel;
          this.preguntaAsistenteSchema = preguntaAsistenteSchema;
          this.variablePreguntaSchema = VariablePreguntaSchema;
     }

     getAll = async (req, res) => {
          const preguntaAsistente =
               await this.preguntaAsistenteSchema.findAll();
          return res.status(200).json(preguntaAsistente);
     };

     create = async (req, res) => {
          try {
               const nuevaPregunta = req.body;
               nuevaPregunta['id_pregunta'] = await this.obtenerUltimoID();

               const variablesUtilizadas = [];
               const valoresEjemplo = {};
               // 2. Extraer variables de la pregunta

               // 🔹 Función auxiliar para procesar variables de cualquier texto
               const procesarVariablesDeTexto = async (texto) => {
                    const variables = this.extraerVariablesDeTexto(texto);
                    for (const nombreVariable of variables) {
                         // Evitar volver a buscar la misma variable
                         if (
                              !variablesUtilizadas.find(
                                   (v) =>
                                        v.nombre_variable_pregunta ===
                                        nombreVariable
                              )
                         ) {
                              const variable =
                                   await this.variablePreguntaSchema.findOne({
                                        where: {
                                             nombre_variable_pregunta:
                                                  nombreVariable,
                                             id_negocio:
                                                  nuevaPregunta.id_negocio,
                                        },
                                   });
                              if (variable) {
                                   variablesUtilizadas.push(variable);
                                   if (
                                        Array.isArray(variable.valores) &&
                                        variable.valores.length > 0
                                   ) {
                                        valoresEjemplo[nombreVariable] =
                                             variable.valores;
                                   } else {
                                        valoresEjemplo[nombreVariable] =
                                             nombreVariable; // fallback
                                   }
                              }
                         }
                    }
               };

               // 🔹 Procesar la pregunta principal
               await procesarVariablesDeTexto(nuevaPregunta.pregunta);

               // 🔹 Procesar sinónimos también
               if (Array.isArray(nuevaPregunta.sinonimos)) {
                    for (const s of nuevaPregunta.sinonimos) {
                         if (typeof s === 'string' && s.trim().length > 0) {
                              await procesarVariablesDeTexto(s);
                         }
                    }
               }

               // 3. Buscar los valores de ejemplo de cada variable
               for (const nombreVariable of variables) {
                    const variable = await this.variablePreguntaSchema.findOne({
                         where: {
                              nombre_variable_pregunta: nombreVariable,
                              id_negocio: nuevaPregunta.id_negocio,
                         },
                    });
                    variablesUtilizadas.push(variable);
                    // Asegurate de que tenga al menos un valor
                    if (
                         variable &&
                         Array.isArray(variable.valores) &&
                         variable.valores.length > 0
                    ) {
                         const valores = variable.valores;
                         // const valorAleatorio =
                         //     valores[Math.floor(Math.random() * valores.length)];
                         valoresEjemplo[nombreVariable] = valores;
                    } else {
                         valoresEjemplo[nombreVariable] = nombreVariable; // fallback
                    }
               }
               // Obtener el project ID del negocio
               const CREDENTIALS = await this.obtenerCredencialesDelNegocio(
                    nuevaPregunta.id_negocio
               );
               const PROJECT_ID = CREDENTIALS.project_id;

               const trainingPhrases = [
                    {
                         type: 'EXAMPLE',
                         parts: this.generarParts(
                              nuevaPregunta.pregunta,
                              valoresEjemplo
                         ),
                    },
                    ...(nuevaPregunta.sinonimos || [])
                         .filter(
                              (s) =>
                                   typeof s === 'string' && s.trim().length > 0
                         )
                         .map((s) => ({
                              type: 'EXAMPLE',
                              parts: this.generarParts(s, valoresEjemplo),
                         })),
               ];
               // 5. Crear el intent en Dialogflow
               await this.crearIntentDesdePregunta({
                    displayName: nuevaPregunta.intencion,
                    trainingPhrases: trainingPhrases,
                    respuesta: nuevaPregunta.respuesta,
                    contextsIn: nuevaPregunta.contexto_entrada || [],
                    contextsOut: nuevaPregunta.contexto_salida || [],
                    // contextsOut: contextsOut,
                    webhook: nuevaPregunta.webhook,
                    id_negocio: nuevaPregunta.id_negocio,
                    valorContextoSalida: nuevaPregunta.valor_respuesta,
                    variablesUtilizadas: variablesUtilizadas,
               });
               const respuestaBD = await this.preguntaAsistenteSchema.create(
                    nuevaPregunta
               );

               return res.status(200).json({
                    type: 'success',
                    message: 'Pregunta de Asistente creada con éxito y sincronizada con Dialogflow.',
                    bd: respuestaBD,
               });
          } catch (error) {
               console.error('Error al crear la pregunta:', error);
               return res.status(500).json({
                    type: 'error',
                    message: 'Ocurrió un error al crear la pregunta.',
               });
          }
     };

     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];
               // Filtro LIKE para 'nombre'
               if (filtros.pregunta) {
                    condiciones.push({
                         pregunta: {
                              [Op.like]: `%${filtros.pregunta}%`,
                         },
                    });
                    delete filtros.pregunta;
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

               const preguntasAsistente =
                    await this.preguntaAsistenteSchema.findAll({
                         ...opcionesConsulta,
                         include: [
                              {
                                   model: RespuestaAsistenteSchema,
                                   as: 'respuestas',
                                   where: idNegocio
                                        ? { id_negocio: idNegocio }
                                        : undefined,
                                   required: false,
                              },
                         ],
                    });
               return res.status(200).json(preguntasAsistente);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar las preguntas de asistente: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const infoPreguntaAsistente = req.body;
               const preguntaAsistente = await this.getPreguntaAsistente(
                    infoPreguntaAsistente
               );
               const configAgente = await NegocioSchema.findOne({
                    where: { id_negocio: infoPreguntaAsistente.id_negocio },
               });

               if (!configAgente || !configAgente.api_key) {
                    throw new Error(
                         'Credenciales de Dialogflow no encontradas'
                    );
               }

               const CREDENTIALS = JSON.parse(configAgente.api_key);

               const CONFIGURATION = {
                    credentials: {
                         private_key: CREDENTIALS['private_key'],
                         client_email: CREDENTIALS['client_email'],
                    },
               };

               const client = new IntentsClient(CONFIGURATION);
               const projectPath = client.projectAgentPath(
                    CREDENTIALS.project_id
               );

               // Listar intents para encontrar el que queremos eliminar
               const [intents] = await client.listIntents({
                    parent: projectPath,
               });
               const intent = intents.find(
                    (i) => i.displayName === preguntaAsistente.intencion
               );

               if (!intent) {
                    return res.status(404).json({
                         type: 'error',
                         message: `Intent con nombre ${preguntaAsistente.intencion} no encontrado en Dialogflow.`,
                    });
               }

               // Eliminar intent en Dialogflow
               await client.deleteIntent({ name: intent.name });

               // Eliminar datos en la base de datos
               await RespuestaAsistenteSchema.destroy({
                    where: { id_pregunta: infoPreguntaAsistente.id_pregunta },
               });
               await preguntaAsistente.destroy();

               res.json({
                    type: 'success',
                    message: 'Pregunta de asistente e intent eliminados correctamente.',
               });
          } catch (error) {
               console.error('Error al eliminar la pregunta:', error);
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar la pregunta del asistente por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          try {
               const nuevaPregunta = req.body;

               // 1. Obtener la pregunta original desde la BD
               const preguntaAsistente = await this.getPreguntaAsistente(
                    req.body
               );

               // 2. Limpiar campos que no queremos actualizar directamente
               const filtros = await this.limpiarCampos(req.body);
               delete filtros.id_pregunta;

               const variablesUtilizadas = [];
               const valoresEjemplo = {};
               // 2. Extraer variables de la pregunta

               // 🔹 Función auxiliar para procesar variables de cualquier texto
               const procesarVariablesDeTexto = async (texto) => {
                    const variables = this.extraerVariablesDeTexto(texto);
                    for (const nombreVariable of variables) {
                         // Evitar volver a buscar la misma variable
                         if (
                              !variablesUtilizadas.find(
                                   (v) =>
                                        v.nombre_variable_pregunta ===
                                        nombreVariable
                              )
                         ) {
                              const variable =
                                   await this.variablePreguntaSchema.findOne({
                                        where: {
                                             nombre_variable_pregunta:
                                                  nombreVariable,
                                             id_negocio:
                                                  nuevaPregunta.id_negocio,
                                        },
                                   });
                              if (variable) {
                                   variablesUtilizadas.push(variable);
                                   if (
                                        Array.isArray(variable.valores) &&
                                        variable.valores.length > 0
                                   ) {
                                        valoresEjemplo[nombreVariable] =
                                             variable.valores;
                                   } else {
                                        valoresEjemplo[nombreVariable] =
                                             nombreVariable; // fallback
                                   }
                              }
                         }
                    }
               };

               // 🔹 Procesar la pregunta principal
               await procesarVariablesDeTexto(nuevaPregunta.pregunta);

               // 🔹 Procesar sinónimos también
               if (Array.isArray(nuevaPregunta.sinonimos)) {
                    for (const s of nuevaPregunta.sinonimos) {
                         if (typeof s === 'string' && s.trim().length > 0) {
                              await procesarVariablesDeTexto(s);
                         }
                    }
               }

               // 5. Obtener el project ID del negocio
               const CREDENTIALS = await this.obtenerCredencialesDelNegocio(
                    nuevaPregunta.id_negocio
               );
               const PROJECT_ID = CREDENTIALS.project_id;

               // 7. Generar las trainingParts

               // const trainingPhrases = [
               //     {
               //         type: "EXAMPLE",
               //         parts: this.generarParts(
               //             nuevaPregunta.pregunta,
               //             valoresEjemplo
               //         ),
               //     },
               //     ...(nuevaPregunta.sinonimos || [])
               //         .filter((s) => typeof s === "string" && s.trim().length > 0)
               //         .map((s) => ({
               //             type: "EXAMPLE",
               //             parts: this.generarParts(s, valoresEjemplo),
               //         })),
               // ];
               const trainingPhrases = [
                    {
                         type: 'EXAMPLE',
                         parts: this.generarParts(
                              nuevaPregunta.pregunta,
                              valoresEjemplo
                         ),
                    },
                    ...(nuevaPregunta.sinonimos || [])
                         .filter(
                              (s) =>
                                   typeof s === 'string' && s.trim().length > 0
                         )
                         .map((s) => ({
                              type: 'EXAMPLE',
                              parts: this.generarParts(s, valoresEjemplo),
                         })),
               ];
               // 8. Actualizar el intent en Dialogflow
               await this.actualizarIntentDesdePregunta({
                    displayName: nuevaPregunta.intencion,
                    trainingPhrases: trainingPhrases,
                    respuesta: nuevaPregunta.respuesta,
                    contextsIn: nuevaPregunta.contexto_entrada || [],
                    // contextsOut: contextsOut,
                    contextsOut: nuevaPregunta.contexto_salida || [],
                    webhook: nuevaPregunta.webhook,
                    id_negocio: nuevaPregunta.id_negocio,
                    variablesUtilizadas: variablesUtilizadas,
               });

               // 9. Actualizar la base de datos
               await this.preguntaAsistenteSchema.update(filtros, {
                    where: {
                         id_pregunta: preguntaAsistente.id_pregunta,
                    },
               });

               return res.json({
                    type: 'success',
                    message: 'Pregunta de asistente actualizada y sincronizada con Dialogflow.',
               });
          } catch (error) {
               console.error('Error al actualizar la pregunta:', error);
               return res.status(500).json({
                    type: 'error',
                    message: 'Ocurrió un error al actualizar la pregunta.',
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

     async getPreguntaAsistente(filtros) {
          try {
               // Se busca el asistente por su id y id_negocio por la primary key compuesta
               const preguntaAsistente =
                    await this.preguntaAsistenteSchema.findOne({
                         where: {
                              id_pregunta: filtros.id_pregunta,
                         },
                    });
               if (!preguntaAsistente)
                    return {
                         type: 'error',
                         message: 'Pregunta de asistente no encontrado',
                    };
               return preguntaAsistente;
          } catch (error) {
               return {
                    type: 'error',
                    message: `Pregunta de asistente no encontrado`,
               };
          }
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro =
                    await this.preguntaAsistenteSchema.findOne({
                         order: [['id_pregunta', 'DESC']],
                    });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_pregunta + 1;
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
     extraerVariablesDeTexto(texto) {
          const regex = /{([^}]+)}/g;
          const variables = [];
          let match;
          while ((match = regex.exec(texto)) !== null) {
               variables.push(match[1].trim());
          }
          return variables;
     }
     generarParts(texto, valoresEjemplo) {
          const regex = /{([^}]+)}/g; // Busca variables entre { }
          let match;
          const parts = [];
          let lastIndex = 0;

          while ((match = regex.exec(texto)) !== null) {
               const varName = match[1].trim();
               const start = match.index;

               // Texto antes de la variable
               if (start > lastIndex) {
                    parts.push({
                         text: texto.substring(lastIndex, start),
                    });
               }

               const valorEjemplo =
                    valoresEjemplo[varName][
                         Math.floor(
                              Math.random() * valoresEjemplo[varName].length
                         )
                    ] || varName;

               // Parte con la entidad normal
               parts.push({
                    text: valorEjemplo,
                    entityType: `@${varName}`,
                    alias: varName,
                    userDefined: true,
               });

               lastIndex = regex.lastIndex;
          }

          // Texto después de la última variable
          if (lastIndex < texto.length) {
               parts.push({
                    text: texto.substring(lastIndex),
               });
          }

          return parts;
     }
     // Función auxiliar para crear el intent
     async crearIntentDesdePregunta({
          displayName,
          trainingPhrases,
          respuesta,
          contextsIn,
          contextsOut,
          webhook,
          id_negocio,
          variablesUtilizadas,
     }) {
          const configAgente = await NegocioSchema.findOne({
               where: { id_negocio },
          });

          if (!configAgente || !configAgente.api_key) {
               throw new Error('Credenciales de Dialogflow no encontradas');
          }

          const CREDENTIALS = JSON.parse(configAgente.api_key);

          const CONFIGURATION = {
               credentials: {
                    private_key: CREDENTIALS['private_key'],
                    client_email: CREDENTIALS['client_email'],
               },
          };

          const intentsClient = new IntentsClient(CONFIGURATION);
          const projectPath = intentsClient.projectAgentPath(
               CREDENTIALS.project_id
          );

          const preguntaDeVariables = [];
          for (const variables of variablesUtilizadas) {
               const valores = {
                    displayName: variables.nombre_variable_pregunta,
                    value: `$${variables.nombre_variable_pregunta}`,
                    entityTypeDisplayName: `@${variables.nombre_variable_pregunta}`,
                    mandatory: true,
                    prompts: [variables.pregunta],
               };

               preguntaDeVariables.push(valores);
          }
          const request = {
               parent: projectPath,
               intent: {
                    displayName: displayName,
                    trainingPhrases: trainingPhrases,
                    parameters: preguntaDeVariables,
                    messages: [
                         {
                              text: {
                                   text: [respuesta],
                              },
                         },
                    ],
                    inputContextNames: contextsIn.map(
                         (ctx) =>
                              `projects/${CREDENTIALS.project_id}/agent/sessions/-/contexts/${ctx}`
                    ),
                    outputContexts: contextsOut.map((ctx) => ({
                         name: `projects/${CREDENTIALS.project_id}/agent/sessions/-/contexts/${ctx}`,
                         lifespanCount: 25, // puedes ajustar esto
                    })),
                    webhookState: webhook
                         ? 'WEBHOOK_STATE_ENABLED'
                         : 'WEBHOOK_STATE_DISABLED',
               },
          };

          await intentsClient.createIntent(request);
     }

     generarOutputContextsDesdeRespuesta(respuesta, projectId) {
          const variables = this.extraerVariablesDeTexto(respuesta);

          return variables.map((variable) => {
               return {
                    name: `projects/${projectId}/agent/sessions/-/contexts/${variable}`,
                    lifespanCount: 25,
                    parameters: {
                         [variable]: '',
                    },
               };
          });
     }
     async obtenerCredencialesDelNegocio(id_negocio) {
          const negocio = await NegocioSchema.findOne({
               where: { id_negocio },
          });

          if (!negocio || !negocio.api_key) {
               throw new Error(
                    'No se encontraron las credenciales del negocio.'
               );
          }

          return JSON.parse(negocio.api_key);
     }

     async actualizarIntentDesdePregunta({
          displayName,
          trainingPhrases,
          respuesta,
          contextsIn = [],
          contextsOut = [],
          webhook,
          id_negocio,
          variablesUtilizadas,
     }) {
          const configAgente = await NegocioSchema.findOne({
               where: { id_negocio },
          });

          if (!configAgente || !configAgente.api_key) {
               throw new Error('Credenciales de Dialogflow no encontradas');
          }

          const CREDENTIALS = JSON.parse(configAgente.api_key);

          const CONFIGURATION = {
               credentials: {
                    private_key: CREDENTIALS['private_key'],
                    client_email: CREDENTIALS['client_email'],
               },
          };

          const preguntaDeVariables = [];
          for (const variables of variablesUtilizadas) {
               const valores = {
                    displayName: variables.nombre_variable_pregunta,
                    value: `$${variables.nombre_variable_pregunta}`,
                    entityTypeDisplayName: `@${variables.nombre_variable_pregunta}`,
                    mandatory: true,
                    prompts: [variables.pregunta],
               };

               preguntaDeVariables.push(valores);
          }

          const intentsClient = new IntentsClient(CONFIGURATION);
          const projectPath = intentsClient.projectAgentPath(
               CREDENTIALS.project_id
          );

          const [intents] = await intentsClient.listIntents({
               parent: projectPath,
          });
          const intent = intents.find((i) => i.displayName === displayName);
          if (!intent) throw new Error(`Intent ${displayName} no encontrado`);

          // 👇 Aseguramos mismo formato que en create
          intent.trainingPhrases = trainingPhrases;
          intent.parameters = preguntaDeVariables;
          intent.messages = [
               {
                    text: { text: [respuesta] },
               },
          ];
          intent.inputContextNames = contextsIn.map(
               (ctx) =>
                    `projects/${CREDENTIALS.project_id}/agent/sessions/-/contexts/${ctx}`
          );

          intent.outputContexts = contextsOut.map((ctx) => ({
               name: `projects/${CREDENTIALS.project_id}/agent/sessions/-/contexts/${ctx}`,
               lifespanCount: 25,
          }));
          intent.webhookState = webhook
               ? 'WEBHOOK_STATE_ENABLED'
               : 'WEBHOOK_STATE_DISABLED';

          await intentsClient.updateIntent({
               intent,
               updateMask: {
                    paths: [
                         'training_phrases',
                         'parameters',
                         'messages',
                         'input_context_names',
                         'output_contexts',
                         'webhook_state',
                    ],
               },
          });
     }
}
