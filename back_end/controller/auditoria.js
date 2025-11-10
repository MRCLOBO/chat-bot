import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';

export class AuditoriaController {
     constructor(Model, Schema) {
          this.model = Model;
          this.schema = Schema;
     }
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];
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
                    include: [
                         {
                              model: NegocioSchema,
                              as: 'negocio',
                              attributes: { exclude: ['api_key'] },
                         },
                    ],
               };

               if (campoOrden && tipoOrden) {
                    opcionesConsulta.order = [[campoOrden, tipoOrden]];
               }
               const registros = await this.schema.findAll(opcionesConsulta);
               return res.status(200).json(registros);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar los registros: ${error}`,
               });
          }
     };
     getAllBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];

               // 1. Filtro por fechas si vienen
               const fechaDesde = filtros?.fecha_desde;
               const fechaHasta = filtros?.fecha_hasta;

               if (fechaDesde || fechaHasta) {
                    const rangoFechas = {};
                    if (fechaDesde) {
                         rangoFechas[Op.gte] = new Date(fechaDesde);
                    }
                    if (fechaHasta) {
                         rangoFechas[Op.lte] = new Date(fechaHasta);
                    }
                    condiciones.push({ fecha_mensaje: rangoFechas });

                    // Eliminar los campos especiales para que no entren en el for
                    delete filtros.fecha_desde;
                    delete filtros.fecha_hasta;
               }

               // 2. Recorrer los demás filtros normales
               for (const key in filtros) {
                    const valor = filtros[key];

                    if (Array.isArray(valor)) {
                         condiciones.push({ [key]: { [Op.in]: valor } });
                    } else if (
                         typeof valor === 'object' &&
                         valor.operador &&
                         valor.valor !== undefined
                    ) {
                         let operadorSequelize;
                         switch (valor.operador) {
                              case 'gt':
                                   operadorSequelize = Op.gt;
                                   break;
                              case 'gte':
                                   operadorSequelize = Op.gte;
                                   break;
                              case 'lt':
                                   operadorSequelize = Op.lt;
                                   break;
                              case 'lte':
                                   operadorSequelize = Op.lte;
                                   break;
                              case 'ne':
                                   operadorSequelize = Op.ne;
                                   break;
                              default:
                                   operadorSequelize = Op.eq;
                                   break;
                         }

                         condiciones.push({
                              [key]: { [operadorSequelize]: valor.valor },
                         });
                    } else {
                         condiciones.push({ [key]: valor });
                    }
               }

               const opcionesConsulta = {
                    where: { [Op.and]: condiciones },
                    include: [
                         {
                              model: NegocioSchema,
                              as: 'negocio',
                              attributes: { exclude: ['api_key'] },
                         },
                    ],
               };

               const registrosAuditoria = await this.schema.findAll(
                    opcionesConsulta
               );
               return res.status(200).json(registrosAuditoria);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar las conversaciones realizadas: ${error}`,
               });
               console.error(`Error en recuperar las conversaciones ${error}`);
          }
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }
}
