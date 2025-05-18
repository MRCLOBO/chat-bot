import { Op, where } from "sequelize";
import { NegocioSchema } from "../models/negocios.js";

export class ProductoController {
  constructor(productoModel, productoSchema) {
    this.productoModel = productoModel;
    this.productoSchema = productoSchema;
    this.NegocioSchema = new NegocioSchema();
  }
  getAll = async (req, res) => {
    const producto = await this.productoSchema.findAll();
    return res.status(200).json(producto);
  };

  create = async (req, res) => {
    try {
      const nuevoProducto = req.body;
      nuevoProducto["id_producto"] = await this.obtenerUltimoID(
        nuevoProducto.id_negocio
      );
      const respuestaBD = await this.productoSchema.create(nuevoProducto);
      return res.status(200).json({
        type: "success",
        message: "Producto creado con exito!",
        bd: respuestaBD,
      });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al crear el producto por el siguiente error: ${error}`,
      });
    }
  };
  getBy = async (req, res) => {
    try {
      const filtros = await this.limpiarCampos(req.body);
      const condiciones = [];
      // Filtro LIKE para 'nombre'
      if (filtros.nombre_producto) {
        condiciones.push({
          nombre_producto: { [Op.like]: `%${filtros.nombre_producto}%` },
        });
        delete filtros.nombre_producto;
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
      const productos = await this.productoSchema.findAll(opcionesConsulta);
      return res.status(200).json(productos);
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al consultar los productos: ${error}`,
      });
    }
  };

  delete = async (req, res) => {
    try {
      const producto = await this.getProducto(req.body);
      await producto.destroy();
      res.json({ mensaje: "Producto eliminado correctamente" });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al eliminar al producto por el siguiente error: ${error}`,
      });
    }
  };

  update = async (req, res) => {
    const producto = await this.getProducto(req.body);
    const filtros = await this.limpiarCampos(req.body);
    delete filtros.id_producto;
    const resultado = await this.productoSchema.update(filtros, {
      where: {
        id_negocio: producto.id_negocio,
        id_producto: producto.id_producto,
      },
    });
    return res.json({ type: "success", message: "Producto modificado" });
  };

  masConsultado = async (req, res) => {
    try {
      const filtros = req.body;
      const opcionesConsulta = {
        where: { [Op.and]: filtros },
        order: [["consultas", "DESC"]],
        limit: 5,
      };
      const productos = await this.productoSchema.findAll(opcionesConsulta);
      return res.status(200).json(productos);
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al consultar los productos: ${error}`,
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

  async getProducto(filtros) {
    try {
      // Se busca al producto por su id y id_negocio por la primary key compuesta
      const producto = await this.productoSchema.findOne({
        where: {
          id_negocio: filtros.id_negocio,
          id_producto: filtros.id_producto,
        },
      });
      if (!producto)
        return { type: "error", message: "Producto no encontrado" };
      return producto;
    } catch (error) {
      return {
        type: "error",
        message: `Producto no encontrado`,
      };
    }
  }
  async obtenerUltimoID(id_negocio) {
    try {
      const ultimoRegistro = await this.productoSchema.findOne({
        order: [["id_producto", "DESC"]],
        where: {
          id_negocio: id_negocio,
        },
      });
      if (ultimoRegistro) {
        return ultimoRegistro.id_producto + 1;
      } else {
        return 1;
      }
    } catch (error) {
      return {
        type: "error",
        message: "Error al recuperar el ultimo ID de la tabla",
      };
    }
  }
  async getNegocio(idNegocio) {
    try {
      const negocio = await NegocioSchema.findByPk(idNegocio);
      if (!negocio) return { type: "error", message: "Negocio no encontrado" };
      return negocio;
    } catch (error) {
      return {
        type: "error",
        message: "Error al recuperar la informacion del negocio",
        error: error,
      };
    }
  }
  async existeNombre(nombre, id_negocio) {
    try {
      const producto = await this.productoSchema.findOne({
        where: {
          nombre_producto: nombre,
          id_negocio: id_negocio,
        },
      });
      if (producto) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return {
        type: "error",
        message: "Error al consultar si ya existe el nombre",
      };
    }
  }
}
