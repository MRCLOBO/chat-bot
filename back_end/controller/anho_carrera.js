import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';

export class AnhoCarreraController {
     constructor(anhoCarreraModel, anhoCarreraSchema) {
          this.anhoCarreraModel = anhoCarreraModel;
          this.anhoCarreraSchema = anhoCarreraSchema;
          this.NegocioSchema = new NegocioSchema();
     }

     create = async (req, res) => {
          try {
               const nuevoAnhoCarrera = req.body;
               nuevoAnhoCarrera['id_anho_carrera'] =
                    await this.obtenerUltimoID();

               const respuestaBD = await this.anhoCarreraSchema.create(
                    nuevoAnhoCarrera
               );
               return res.status(200).json({
                    type: 'success',
                    message: 'Año registrado con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear el año por el siguiente error: ${error}`,
               });
               console.error(error);
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];
               // Filtro LIKE para 'nombre'
               if (filtros.denominacion) {
                    condiciones.push({
                         denominacion: {
                              [Op.like]: `%${filtros.denominacion}%`,
                         },
                    });
                    delete filtros.denominacion;
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
               const anhos_carrera = await this.anhoCarreraSchema.findAll({
                    ...opcionesConsulta,
                    include: [
                         {
                              model: NegocioSchema,
                              as: 'negocio',
                              attributes: { exclude: ['api_key'] },
                         },
                    ],
               });
               return res.status(200).json(anhos_carrera);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar los años registrados: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const anhoCarrera = await this.getAnhoCarrera(req.body);
               await anhoCarrera.destroy();
               res.json({ mensaje: 'Año eliminado correctamente' });
          } catch (error) {
               console.error(error);
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar el año por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          const anhoCarrera = await this.getAnhoCarrera(req.body);
          const filtros = await this.limpiarCampos(req.body);
          const resultado = await this.anhoCarreraSchema.update(filtros, {
               where: {
                    id_anho_carrera: anhoCarrera.id_anho_carrera,
               },
          });
          return res.json({ type: 'success', message: 'Año modificado' });
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }

     async getAnhoCarrera(filtros) {
          try {
               // Se busca el anhoCarrera por su id y id_negocio por la primary key compuesta
               const anhoCarrera = await this.anhoCarreraSchema.findOne({
                    where: {
                         id_anho_carrera: filtros.id_anho_carrera,
                    },
               });
               if (!anhoCarrera)
                    return {
                         type: 'error',
                         message: 'Año no encontrado',
                    };
               return anhoCarrera;
          } catch (error) {
               return res.status(200).json({
                    type: 'error',
                    message: `Año no encontrado`,
               });
          }
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro = await this.anhoCarreraSchema.findOne({
                    order: [['id_anho_carrera', 'DESC']],
               });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_anho_carrera + 1;
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
