import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';
import { CarreraSchema } from '../models/carrera.js';
import { AnhoCarreraSchema } from '../models/anho_carrera.js';
import { TurnoCarreraSchema } from '../models/turno_carrera.js';

export class CursoController {
     constructor(cursoModel, cursoSchema) {
          this.modelo = cursoModel;
          this.schema = cursoSchema;
          this.NegocioSchema = new NegocioSchema();
          this.carreraSchema = new CarreraSchema();
          this.anhoCarreraSchema = new AnhoCarreraSchema();
          this.turnoCarreraSchema = new TurnoCarreraSchema();
     }

     create = async (req, res) => {
          try {
               const nuevo = req.body;
               nuevo['id_curso'] = await this.obtenerUltimoID();

               const respuestaBD = await this.schema.create(nuevo);
               return res.status(200).json({
                    type: 'success',
                    message: 'Registrado con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear el registro por el siguiente error: ${error}`,
               });
               console.error(error);
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];

               for (const key in filtros) {
                    condiciones.push({ [key]: filtros[key] });
               }
               // Armar la consulta con ordenamiento si aplica
               const opcionesConsulta = {
                    where: { [Op.and]: condiciones },
               };

               const anhos_carrera = await this.schema.findAll({
                    ...opcionesConsulta,
                    include: [
                         {
                              model: NegocioSchema,
                              as: 'negocio',
                              attributes: { exclude: ['api_key'] },
                         },
                         {
                              model: TurnoCarreraSchema,
                              as: 'turno_carrera',
                         },
                         {
                              model: CarreraSchema,
                              as: 'carrera',
                         },
                         {
                              model: AnhoCarreraSchema,
                              as: 'anho_carrera',
                         },
                    ],
               });
               return res.status(200).json(anhos_carrera);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar los datos registrados: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const registro = await this.getRegistro(req.body);
               await registro.destroy();
               res.json({ mensaje: 'Eliminado correctamente' });
          } catch (error) {
               console.error(error);
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar el registro por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          const registro = await this.getRegistro(req.body);
          const filtros = await this.limpiarCampos(req.body);
          const resultado = await this.schema.update(filtros, {
               where: {
                    id_curso: registro.id_curso,
               },
          });
          return res.json({ type: 'success', message: 'Registro Modificado' });
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }

     async getRegistro(filtros) {
          try {
               // Se busca el registro por su id y id_negocio por la primary key compuesta
               const registro = await this.schema.findOne({
                    where: {
                         id_curso: filtros.id_curso,
                    },
               });
               if (!registro)
                    return {
                         type: 'error',
                         message: 'Registro encontrado',
                    };
               return registro;
          } catch (error) {
               return res.status(200).json({
                    type: 'error',
                    message: `Registro no encontrado`,
               });
          }
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro = await this.schema.findOne({
                    order: [['id_curso', 'DESC']],
               });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_curso + 1;
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
