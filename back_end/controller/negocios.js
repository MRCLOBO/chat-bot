import { Op, where } from 'sequelize';
import { HorarioSchema } from '../models/horario.js';
import { CategoriaController } from './categoria.js';
import { CategoriaModel, CategoriaSchema } from '../models/categoria.js';
import { sequelize } from '../config/database.js';

export class NegocioController {
     constructor(negocioModel, negocioSchema) {
          this.negocioModel = negocioModel;
          this.negocioSchema = negocioSchema;
     }
     setCurrentUser = async (usuario) => {
          if (!usuario) return;
          await sequelize.query(`SET "app.current_user" = '${usuario}'`);
     };

     create = async (req, res) => {
          try {
               const usuario = req.headers['x-apodo'] || 'desconocido';
               this.setCurrentUser(usuario);
               const nuevoNegocio = req.body;
               const idNegocio = await this.obtenerUltimoID();
               nuevoNegocio.id_negocio = idNegocio;
               const respuestaBD = await this.negocioSchema.create(
                    nuevoNegocio
               );
               const categoriaGenerica = {
                    id_negocio: respuestaBD.id_negocio,
                    nombre_categoria: 'GENERICO',
                    descripcion:
                         'Categoria creada por defecto para agrupar todo tipo de articulos',
                    nombre_negocio: respuestaBD.nombre_negocio,
               };
               const respuestaCategoriaGenerica = await CategoriaSchema.create(
                    categoriaGenerica
               );
               return res.status(200).json({
                    type: 'success',
                    message: '¡Negocio creado con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear el negocio por el siguiente error: ${error}`,
               });
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               let negocios = [];
               if (filtros != []) {
                    negocios = await this.negocioSchema.findAll({
                         where: {
                              [Op.and]: filtros,
                         },
                    });
               } else {
                    negocios = await this.negocioSchema.findAll();
               }
               return res.status(200).json(negocios);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar los negocios por el siguiente error: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const usuario = req.headers['x-apodo'] || 'desconocido';
               this.setCurrentUser(usuario);
               const negocio = await this.getNegocio(req.body);
               await HorarioSchema.destroy({
                    where: {
                         id_negocio: negocio.id_negocio,
                    },
               });
               await negocio.destroy();
               res.json({ mensaje: 'Negocio eliminado correctamente' });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar al negocio por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          const usuario = req.headers['x-apodo'] || 'desconocido';
          this.setCurrentUser(usuario);
          const negocio = await this.getNegocio(req.body);
          const filtros = await this.limpiarCampos(req.body);
          delete filtros.id_negocio;
          const resultado = await this.negocioSchema.update(filtros, {
               where: { id_negocio: negocio.id_negocio },
          });
          return res.json({ type: 'success', message: 'Negocio modificado' });
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }

     async getNegocio(filtros) {
          const negocio = await this.negocioSchema.findByPk(filtros.id_negocio);
          if (!negocio)
               return { type: 'error', message: 'Negocio no encontrado' };
          return negocio;
     }
     async obtenerUltimoID() {
          try {
               const ultimoRegistro = await this.negocioSchema.findOne({
                    order: [['id_negocio', 'DESC']],
               });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_negocio + 1;
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
