import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';

export class RespuestaAsistenteController {
     constructor(respuestaAsistenteModel, respuestaAsistenteSchema) {
          this.respuestaAsistenteModel = respuestaAsistenteModel;
          this.respuestaAsistenteSchema = respuestaAsistenteSchema;
          this.NegocioSchema = new NegocioSchema();
     }

     getAll = async (req, res) => {
          const respuestaAsistente =
               await this.respuestaAsistenteSchema.findAll();
          return res.status(200).json(respuestaAsistente);
     };

     create = async (req, res) => {
          try {
               const nuevaRespuesta = req.body;
               nuevaRespuesta['id_respuesta'] = await this.obtenerUltimoID();
               const negocioVinculado = await this.getNegocio(
                    nuevaRespuesta.id_negocio
               );
               nuevaRespuesta['nombre_negocio'] =
                    negocioVinculado.dataValues.nombre_negocio;
               const respuestaBD = await this.respuestaAsistenteSchema.create(
                    nuevaRespuesta
               );
               return res.status(200).json({
                    type: 'success',
                    message: 'Respuesta de Asistente creada con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear la respuesta del asistente por el siguiente error: ${error}`,
               });
               console.error(error);
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];
               // Filtro LIKE para 'nombre'
               if (filtros.respuesta) {
                    condiciones.push({
                         respuesta: {
                              [Op.like]: `%${filtros.respuesta}%`,
                         },
                    });
                    delete filtros.respuesta;
               }
               // Extraer los valores de ordenamiento y eliminarlos del objeto de filtros
               const campoOrden = filtros.orden;
               const tipoOrden = filtros.tipo_orden;
               delete filtros.orden;
               delete filtros.tipo_orden;
               // Resto de filtros exactos
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
               const respuestasAsistente =
                    await this.respuestaAsistenteSchema.findAll({
                         ...opcionesConsulta,
                         include: [
                              {
                                   model: NegocioSchema,
                                   as: 'negocio',
                              },
                         ],
                    });
               return res.status(200).json(respuestasAsistente);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar las respuestas de asistente: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const respuestaAsistente = await this.getRespuestaAsistente(
                    req.body
               );
               await respuestaAsistente.destroy();
               res.json({
                    mensaje: 'Respuesta de asistente eliminado correctamente',
               });
          } catch (error) {
               console.error(error);
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar la respuesta del asistente por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          const respuestaAsistencia = await this.getRespuestaAsistente(
               req.body
          );
          const filtros = await this.limpiarCampos(req.body);
          delete filtros.id_respuesta;
          const resultado = await this.respuestaAsistenteSchema.update(
               filtros,
               {
                    where: {
                         id_respuesta: respuestaAsistencia.id_respuesta,
                    },
               }
          );
          return res.json({
               type: 'success',
               message: 'Respuesta de asistente modificado',
          });
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }

     async getRespuestaAsistente(filtros) {
          try {
               // Se busca el asistente por su id y id_negocio por la primary key compuesta
               const respuestaAsistente =
                    await this.respuestaAsistenteSchema.findOne({
                         where: {
                              id_pregunta: filtros.id_pregunta,
                         },
                    });
               if (!respuestaAsistente)
                    return {
                         type: 'error',
                         message: 'Respuesta de asistente no encontrado',
                    };
               return respuestaAsistente;
          } catch (error) {
               return res.status(200).json({
                    type: 'error',
                    message: `Respuesta de asistente no encontrado`,
               });
          }
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro =
                    await this.respuestaAsistenteSchema.findOne({
                         order: [['id_respuesta', 'DESC']],
                    });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_respuesta + 1;
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
     async getNegocio(idNegocio) {
          try {
               const negocio = await NegocioSchema.findByPk(idNegocio);
               if (!negocio)
                    return { type: 'error', message: 'Negocio no encontrado' };
               return negocio;
          } catch (error) {
               return {
                    type: 'error',
                    message: 'Error al recuperar la informacion del negocio',
                    error: error,
               };
          }
     }
}
