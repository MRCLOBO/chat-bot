//import { this.movieModel } from "../views/usuario.js";
import { Op, where } from "sequelize";
import { UsuarioSchema } from "../models/usuarios.js";

export class UsuarioController {
  constructor(usuarioModel, usuarioSchema) {
    this.usuarioModel = usuarioModel;
    this.usuarioSchema = usuarioSchema;
  }
  getAll = async (req, res) => {
    const usuarios = await this.usuarioSchema.findAll();
    return res.status(200).json(usuarios);
  };

  create = async (req, res) => {
    try {
      const nuevoUsuario = await this.usuarioSchema.create(req);
      return res
        .status(200)
        .json({ type: "success", message: "¡Usuario creado con exito!" });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al crear el usuario por el siguiente error: ${error}`,
      });
    }
  };
  getBy = async (req, res) => {
    try {
      // Filtrar las claves con valores null
      const filtros = await this.limpiarCampos(req.body);
      const usuarios = await this.usuarioSchema.findAll({
        where: {
          [Op.and]: filtros,
        },
      });
      return res.status(200).json(usuarios);
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al consultar los usuarios por el siguiente error: ${error}   req: ${req.body}   filtros: ${filtros}`,
      });
    }
  };

  delete = async (req, res) => {
    try {
      const usuario = await this.getUsuario(req);
      await usuario.destroy();
      res.json({ mensaje: "Usuario eliminado correctamente" });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al eliminar al usuario por el siguiente error: ${error}`,
      });
    }
  };

  update = async (req, res) => {
    const usuario = await this.getUsuario(req);
    const filtros = await this.limpiarCampos(req);
    await usuario.update(filtros);
  };

  async limpiarCampos(filtros) {
    //Se elimina todo aquel campo que tenga como valor "null"
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(([_, value]) => value !== null)
    );
    return filtrosLimpios;
  }

  async getUsuario(filtros) {
    // Se busca al usuario por su id y id_negocio por la primary key compuesta
    const usuario = await UsuarioSchema.findByPk(
      filtros.id_usuario,
      where(col("id_negocio"), Op.eq, filtros.id_negocio)
    );
    if (!usuario)
      return res
        .status(404)
        .json({ type: "error", message: "Usuario no encontrado" });
    return usuario;
  }
}
