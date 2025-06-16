import { Op, where, fn, col } from 'sequelize';
import { NegocioSchema } from '../models/negocios.js';
import { ProductoSchema } from '../models/producto.js';

export class CategoriaController {
     constructor(categoriaModel, categoriaSchema) {
          this.categoriaModel = categoriaModel;
          this.categoriaSchema = categoriaSchema;
          this.NegocioSchema = new NegocioSchema();
          this.categoriaSchema.hasMany(ProductoSchema, {
               foreignKey: 'id_categoria',
               as: 'producto',
          });
          ProductoSchema.belongsTo(this.categoriaSchema, {
               foreignKey: 'id_categoria',
               as: 'categoria',
          });
     }
     getAll = async (req, res) => {
          const categoria = await this.categoriaSchema.findAll();
          return res.status(200).json(categoria);
     };

     create = async (req, res) => {
          try {
               const nuevaCategoria = req.body;
               nuevaCategoria['id_categoria'] = await this.obtenerUltimoID(
                    nuevaCategoria.id_negocio
               );
               const negocioVinculado = await this.getNegocio(
                    nuevaCategoria.id_negocio
               );
               nuevaCategoria['nombre_negocio'] =
                    negocioVinculado.dataValues.nombre_negocio;
               const respuestaBD = await this.categoriaSchema.create(
                    nuevaCategoria
               );
               return res.status(200).json({
                    type: 'success',
                    message: 'Categoria creada con exito!',
                    bd: respuestaBD,
               });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al crear la categoria por el siguiente error: ${error}`,
               });
          }
     };
     getBy = async (req, res) => {
          try {
               const filtros = await this.limpiarCampos(req.body);
               const condiciones = [];

               if (filtros.nombre_categoria) {
                    condiciones.push({
                         nombre_categoria: {
                              [Op.like]: `%${filtros.nombre_categoria}%`,
                         },
                    });
                    delete filtros.nombre_categoria;
               }

               const campoOrden = filtros.orden;
               const tipoOrden = filtros.tipo_orden;
               delete filtros.orden;
               delete filtros.tipo_orden;

               for (const key in filtros) {
                    condiciones.push({ [key]: filtros[key] });
               }

               const opcionesConsulta = {
                    where: { [Op.and]: condiciones },
                    attributes: [
                         'id_categoria',
                         'nombre_categoria',
                         'descripcion',
                         'id_negocio',
                         'nombre_negocio',
                         [
                              fn('COUNT', col('producto.id_producto')),
                              'cantidad_productos',
                         ],
                    ],
                    include: [
                         {
                              model: ProductoSchema,
                              as: 'producto',
                              required: false, // LEFT OUTER JOIN
                              attributes: [],
                              on: {
                                   [Op.and]: [
                                        where(
                                             col('Categoria.id_categoria'),
                                             '=',
                                             col('producto.id_categoria')
                                        ),
                                        where(
                                             col('Categoria.id_negocio'),
                                             '=',
                                             col('producto.id_negocio')
                                        ),
                                   ],
                              },
                         },
                    ],
                    group: [
                         'Categoria.id_categoria',
                         'Categoria.nombre_categoria',
                         'Categoria.descripcion',
                         'Categoria.id_negocio',
                         'Categoria.nombre_negocio',
                    ],
               };

               if (campoOrden && tipoOrden) {
                    opcionesConsulta.order = [[campoOrden, tipoOrden]];
               }

               const categorias = await this.categoriaSchema.findAll(
                    opcionesConsulta
               );

               return res.status(200).json(categorias);
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al consultar las categorias: ${error}`,
               });
          }
     };

     delete = async (req, res) => {
          try {
               const categoria = await this.getCategoria(req.body);
               await categoria.destroy();
               res.json({ mensaje: 'Categoria eliminada correctamente' });
          } catch (error) {
               res.status(500).json({
                    type: 'error',
                    message: `Error al eliminar la categoria por el siguiente error: ${error}`,
               });
          }
     };

     update = async (req, res) => {
          const categoria = await this.getCategoria(req.body);
          const filtros = await this.limpiarCampos(req.body);
          delete filtros.id_categoria;
          const resultado = await this.categoriaSchema.update(filtros, {
               where: {
                    id_negocio: categoria.id_negocio,
                    id_categoria: categoria.id_categoria,
               },
          });
          return res.json({ type: 'success', message: 'Categoria modificada' });
     };

     async limpiarCampos(filtros) {
          //Se elimina todo aquel campo que tenga como valor "null"
          const filtrosLimpios = Object.fromEntries(
               Object.entries(filtros).filter(([_, value]) => value !== null)
          );
          return filtrosLimpios;
     }

     async getCategoria(filtros) {
          try {
               // Se busca la categoria por su id y id_negocio por la primary key compuesta
               const categoria = await this.categoriaSchema.findOne({
                    where: {
                         id_negocio: filtros.id_negocio,
                         id_categoria: filtros.id_categoria,
                    },
               });
               if (!categoria)
                    return {
                         type: 'error',
                         message: 'Categoria no encontrada',
                    };
               return categoria;
          } catch (error) {
               return res.status(200).json({
                    type: 'error',
                    message: `Categoria no encontrada`,
               });
          }
     }
     async obtenerUltimoID(id_negocio) {
          try {
               const ultimoRegistro = await this.categoriaSchema.findOne({
                    order: [['id_categoria', 'DESC']],
                    where: {
                         id_negocio: id_negocio,
                    },
               });
               if (ultimoRegistro) {
                    return ultimoRegistro.id_categoria + 1;
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
               const categoria = await this.categoriaSchema.findOne({
                    where: {
                         nombre_categoria: nombre,
                         id_negocio: id_negocio,
                    },
               });
               if (categoria) {
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
