import { Op, where } from "sequelize";

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
      const nuevoUsuario = req.body;
      nuevoUsuario.id_usuario = await this.obtenerUltimoID(
        nuevoUsuario.id_negocio
      );
      await this.usuarioSchema.create(nuevoUsuario);
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
        message: `Error al consultar los usuarios por el siguiente error: ${error}`,
      });
    }
  };

  delete = async (req, res) => {
    try {
      const usuario = await this.getUsuario(req.body);
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
    const usuario = await this.getUsuario(req.body);
    const filtros = await this.limpiarCampos(req.body);
    await usuario.update(filtros);
  };

  login = async (req, res) => {
    const filtros = req.body;
    const usuario = await this.usuarioSchema.findOne({
      where: { nombre_usuario: filtros.nombre_usuario },
    });
    if (usuario) {
      if (usuario.contrasena === filtros.contrasena) {
        usuario.contrasena = null;
        return res.status(200).json(usuario);
      }
      if (usuario.contrasena !== filtros.contrasena) {
        return res.status(200).json({
          type: "error",
          message: `Contraseña incorrecta, intentelo de nuevo`,
        });
      }
    } else {
      return res.status(200).json({
        type: "error",
        message: `Nombre de usuario no registrado`,
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

  async getUsuario(filtros) {
    // Se busca al usuario por su id y id_negocio por la primary key compuesta
    const usuario = await this.usuarioSchema.findByPk(
      filtros.id_usuario,
      where(col("id_negocio"), Op.eq, filtros.id_negocio)
    );
    if (!usuario) return { type: "error", message: "Usuario no encontrado" };
    return usuario;
  }
  async obtenerUltimoID(id_negocio) {
    try {
      const ultimoRegistro = await this.usuarioSchema.findOne({
        order: [["id_usuario", "DESC"]],
        where: {
          id_negocio: id_negocio,
        },
      });
      if (ultimoRegistro) {
        return ultimoRegistro.id_usuario + 1;
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
}
