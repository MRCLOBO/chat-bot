import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';

export class AsistenteController {
     constructor(asistenteModel, asistenteSchema) {
          this.asistenteModel = asistenteModel;
          this.asistenteSchema = asistenteSchema;
          this.NegocioSchema = new NegocioSchema();
     }

     getAll = async (req, res) => {
          const asistente = await this.asistenteSchema.findAll();
          return res.status(200).json(asistente);
     };

     create = async (req, res) => {
          try {
               const nuevoAsistente = req.body;
               nuevoAsistente['id_asistente'] = await this.obtenerUltimoID();
               const negocioVinculado = await this.getNegocio(
                    nuevoAsistente.id_negocio
               );
               nuevoAsistente['nombre_negocio'] =
                    negocioVinculado.dataValues.nombre_negocio;
               const respuestaBD = await this.asistenteSchema.create(
                    nuevoAsistente
               );
               return res.status(200).json({
                    type: 'success',
                    message: 'Asistente creado con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear el asistente por el siguiente error: ${error}`,
               });
               console.error(error);
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];
               // Filtro LIKE para 'nombre'
               if (filtros.nombre_asistente) {
                    condiciones.push({
                         nombre_asistente: {
                              [Op.like]: `%${filtros.nombre_asistente}%`,
                         },
                    });
                    delete filtros.nombre_asistente;
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
               const asistentes = await this.asistenteSchema.findAll({
                    ...opcionesConsulta,
                    include: [
                         {
                              model: NegocioSchema,
                              as: 'negocio',
                              attributes: { exclude: ['api_key'] },
                         },
                    ],
               });
               return res.status(200).json(asistentes);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar los asistentes: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const asistente = await this.getAsistente(req.body);
               await asistente.destroy();
               res.json({ mensaje: 'Asistente eliminado correctamente' });
          } catch (error) {
               console.error(error);
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar el asistente por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          const asistente = await this.getAsistente(req.body);
          const filtros = await this.limpiarCampos(req.body);
          delete filtros.id_asistente;
          const resultado = await this.asistenteSchema.update(filtros, {
               where: {
                    id_asistente: asistente.id_asistente,
               },
          });
          return res.json({ type: 'success', message: 'Asistente modificado' });
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }

     async getAsistente(filtros) {
          try {
               // Se busca el asistente por su id y id_negocio por la primary key compuesta
               const asistente = await this.asistenteSchema.findOne({
                    where: {
                         id_asistente: filtros.id_asistente,
                    },
               });
               if (!asistente)
                    return {
                         type: 'error',
                         message: 'Asistente no encontrado',
                    };
               return asistente;
          } catch (error) {
               return res.status(200).json({
                    type: 'error',
                    message: `Asistente no encontrado`,
               });
          }
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro = await this.asistenteSchema.findOne({
                    order: [['id_asistente', 'DESC']],
               });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_asistente + 1;
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
     async existeNombre(nombre, id_negocio) {
          try {
               const asistente = await this.asistenteSchema.findOne({
                    where: {
                         nombre_asistente: nombre,
                         id_negocio: id_negocio,
                    },
               });
               if (asistente) {
                    return true;
               } else {
                    return false;
               }
          } catch (error) {
               return {
                    type: 'error',
                    message: 'Error al consultar si ya existe el nombre',
               };
          }
     }
}
