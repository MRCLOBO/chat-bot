import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';

export class AlumnoController {
     constructor(alumnoModel, alumnoSchema) {
          this.alumnoModel = alumnoModel;
          this.alumnoSchema = alumnoSchema;
          this.NegocioSchema = new NegocioSchema();
     }

     create = async (req, res) => {
          try {
               const nuevoAlumno = req.body;
               nuevoAlumno['id_alumno'] = await this.obtenerUltimoID();
               const negocioVinculado = await this.getNegocio(
                    nuevoAlumno.id_negocio
               );
               nuevoAlumno['nombre_negocio'] =
                    negocioVinculado.dataValues.nombre_negocio;
               const respuestaBD = await this.alumnoSchema.create(nuevoAlumno);
               return res.status(200).json({
                    type: 'success',
                    message: 'Alumno registrado con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear el alumno por el siguiente error: ${error}`,
               });
               console.error(error);
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];
               // Filtro LIKE para 'nombre'
               if (filtros.nombre_alumno) {
                    condiciones.push({
                         nombre_alumno: {
                              [Op.like]: `%${filtros.nombre_alumno}%`,
                         },
                    });
                    delete filtros.nombre_alumno;
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
               const alumnos = await this.alumnoSchema.findAll({
                    ...opcionesConsulta,
                    include: [
                         {
                              model: NegocioSchema,
                              as: 'negocio',
                         },
                    ],
               });
               return res.status(200).json(alumnos);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar los alumnos: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const alumno = await this.getAlumno(req.body);
               await alumno.destroy();
               res.json({ mensaje: 'Alumno eliminado correctamente' });
          } catch (error) {
               console.error(error);
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar el alumno por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          const alumno = await this.getAlumno(req.body);
          const filtros = await this.limpiarCampos(req.body);
          const resultado = await this.alumnoSchema.update(filtros, {
               where: {
                    id_alumno: alumno.id_alumno,
               },
          });
          return res.json({ type: 'success', message: 'Alumno modificado' });
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }

     async getAlumno(filtros) {
          try {
               // Se busca el alumno por su id y id_negocio por la primary key compuesta
               const alumno = await this.alumnoSchema.findOne({
                    where: {
                         id_alumno: filtros.id_alumno,
                    },
               });
               if (!alumno)
                    return {
                         type: 'error',
                         message: 'Alumno no encontrado',
                    };
               return alumno;
          } catch (error) {
               return res.status(200).json({
                    type: 'error',
                    message: `Alumno no encontrado`,
               });
          }
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro = await this.alumnoSchema.findOne({
                    order: [['id_alumno', 'DESC']],
               });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_alumno + 1;
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
               const alumno = await this.alumnoSchema.findOne({
                    where: {
                         nombre_alumno: nombre,
                         id_negocio: id_negocio,
                    },
               });
               if (alumno) {
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
