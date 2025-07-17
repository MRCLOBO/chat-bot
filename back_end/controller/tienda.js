import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';
import { AsistenteSchema } from '../models/asistente.js';
import { RespuestaAsistenteSchema } from '../models/respuesta-asistente.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { EntityTypesClient } = require('@google-cloud/dialogflow');

export class TiendaController {
     constructor(TiendaModel, TiendaSchema) {
          this.tiendaModel = TiendaModel;
          this.tiendaSchema = TiendaSchema;
     }

     getAll = async (req, res) => {
          const tienda = await this.tiendaSchema.findAll();
          return res.status(200).json(tienda);
     };

     create = async (req, res) => {
          try {
               const nuevaTienda = req.body;
               nuevaTienda['id_tienda'] = await this.obtenerUltimoID();
               const respuestaBD = await this.tiendaSchema.create(nuevaTienda);
               return res.status(200).json({
                    type: 'success',
                    message: 'Tienda creada con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear la tienda por el siguiente error: ${error}`,
               });
               console.error(error);
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];
               // Filtro LIKE para 'nombre'
               if (filtros.id_publico) {
                    condiciones.push({
                         id_publico: {
                              [Op.like]: `%${filtros.id_publico}%`,
                         },
                    });
                    delete filtros.id_publico;
               }
               // Extraer los valores de ordenamiento y eliminarlos del objeto de filtros
               const campoOrden = filtros.orden;
               const tipoOrden = filtros.tipo_orden;
               delete filtros.orden;
               delete filtros.tipo_orden;
               // Resto de filtros exactos
               let idPublico = '';
               if (filtros.id_publico) {
                    idPublico = filtros.id_publico;
                    delete filtros.id_publico;
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

               const tienda = await this.tiendaSchema.findAll({
                    ...opcionesConsulta,
               });
               return res.status(200).json(tienda);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar las tiendas: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const tienda = await this.getTienda(req.body);

               await tienda.destroy();

               return res.json({
                    type: 'success',
                    message: 'Tienda eliminada correctamente',
               });
          } catch (error) {
               console.error('Error al eliminar la tienda:', error);
               return res.status(500).json({
                    type: 'error',
                    message: 'Ocurrió un error al intentar eliminar la tienda',
               });
          }
     };

     update = async (req, res) => {
          try {
               const tienda = await this.getTienda(req.body);
               const filtros = await this.limpiarCampos(req.body);
               delete filtros.id_tienda;

               const resultado = await this.tiendaSchema.update(filtros, {
                    where: {
                         id_tienda: tienda.id_tienda,
                    },
               });
               return res.json({
                    type: 'success',
                    message: 'Tienda modificada',
               });
          } catch (error) {
               console.error(error);
               return res.json({
                    type: 'error',
                    message: 'Error al modificar la tienda',
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

     async getTienda(filtros) {
          try {
               // Se busca el asistente por su id y id_negocio por la primary key compuesta
               const tienda = await this.tiendaSchema.findOne({
                    where: {
                         id_tienda: filtros.id_tienda,
                    },
               });
               if (!tienda)
                    return {
                         type: 'error',
                         message: 'Tienda no encontrada',
                    };
               return tienda;
          } catch (error) {
               return {
                    type: 'error',
                    message: `Tienda no encontrada`,
               };
          }
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro = await this.tiendaSchema.findOne({
                    order: [['id_tienda', 'DESC']],
               });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_tienda + 1;
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
