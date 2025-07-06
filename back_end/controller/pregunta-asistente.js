import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';
import { AsistenteSchema } from '../models/asistente.js';
import { RespuestaAsistenteSchema } from '../models/respuesta-asistente.js';

export class PreguntaAsistenteController {
     constructor(preguntaAsistenteModel, preguntaAsistenteSchema) {
          this.preguntaAsistenteModel = preguntaAsistenteModel;
          this.preguntaAsistenteSchema = preguntaAsistenteSchema;
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
               const respuestaBD = await this.preguntaAsistenteSchema.create(
                    nuevaPregunta
               );
               if (
                    nuevaPregunta.id_negocio &&
                    nuevaPregunta.id_negocio !== null
               ) {
                    const negocio = await NegocioSchema.findOne({
                         where: { id_negocio: nuevaPregunta.id_negocio },
                         include: [{ model: AsistenteSchema, as: 'asistente' }],
                    });
                    const respuesta = {
                         id_asistente: negocio.asistente.id_asistente,
                         nombre_asistente: negocio.asistente.nombre_asistente,
                         id_negocio: negocio.id_negocio,
                         nombre_negocio: negocio.nombre_negocio,
                         respuesta: nuevaPregunta.respuesta,
                         id_pregunta: nuevaPregunta.id_pregunta,
                    };
                    await RespuestaAsistenteSchema.create(respuestasAsistente);
                    return res.status(200).json({
                         type: 'success',
                         message: 'Pregunta de Asistente creada con exito!',
                         bd: respuestaBD,
                    });
               }
               if (nuevaPregunta.id_negocio === null) {
                    /**
                     * Poner respuesta generica a cada negocio luego de la creacion de una pregunta
                     */
                    const negocios = await NegocioSchema.findAll({
                         include: [{ model: AsistenteSchema, as: 'asistente' }],
                    });
                    const respuestasAsistente = negocios
                         .filter((negocio) => negocio.asistente)
                         .map((negocio) => {
                              const asistente = negocio.asistente;

                              return {
                                   id_asistente: asistente.id_asistente,
                                   nombre_asistente: asistente.nombre_asistente,
                                   id_negocio: negocio.id_negocio,
                                   nombre_negocio: negocio.nombre_negocio,
                                   respuesta: nuevaPregunta.respuesta,
                                   id_pregunta: nuevaPregunta.id_pregunta,
                              };
                         });
                    await RespuestaAsistenteSchema.bulkCreate(
                         respuestasAsistente
                    );
                    return res.status(200).json({
                         type: 'success',
                         message: 'Pregunta de Asistente creada con exito!',
                         bd: respuestaBD,
                    });
               }
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear la pregunta del asistente por el siguiente error: ${error}`,
               });
               console.error(error);
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
                    req.body
               );
               await RespuestaAsistenteSchema.destroy({
                    where: {
                         id_pregunta: infoPreguntaAsistente.id_pregunta,
                    },
               });
               await preguntaAsistente.destroy();
               res.json({
                    mensaje: 'Pregunta de asistente eliminada correctamente',
               });
          } catch (error) {
               console.error(error);
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar la pregunta del asistente por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          const preguntaAsistente = await this.getPreguntaAsistente(req.body);
          const filtros = await this.limpiarCampos(req.body);
          delete filtros.id_pregunta;
          const resultado = await this.preguntaAsistenteSchema.update(filtros, {
               where: {
                    id_pregunta: preguntaAsistente.id_pregunta,
               },
          });
          return res.json({
               type: 'success',
               message: 'Pregunta de asistente modificado',
          });
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
}
