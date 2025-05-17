import { Op, where } from "sequelize";
import { NegocioSchema } from "../models/negocios.js";

export class UsuarioController {
  constructor(usuarioModel, usuarioSchema) {
    this.usuarioModel = usuarioModel;
    this.usuarioSchema = usuarioSchema;
    this.NegocioSchema = new NegocioSchema();
  }
  getAll = async (req, res) => {
    const usuarios = await this.usuarioSchema.findAll();
    return res.status(200).json(usuarios);
  };

  create = async (req, res) => {
    try {
      const nuevoUsuario = req.body;
      nuevoUsuario["id_usuario"] = await this.obtenerUltimoID(
        nuevoUsuario.id_negocio
      );
      if (await this.existeApodo(nuevoUsuario.apodo)) {
        return res.status(200).json({
          type: "error",
          message: "Este apodo no se encuentra disponible",
        });
      }
      const negocioVinculado = await this.getNegocio(nuevoUsuario.id_negocio);
      nuevoUsuario["nombre_negocio"] =
        negocioVinculado.dataValues.nombre_negocio;
      const respuestaBD = await this.usuarioSchema.create(nuevoUsuario);
      return res.status(200).json({
        type: "success",
        message: "¡Usuario creado con exito!",
        bd: respuestaBD,
      });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al crear el usuario por el siguiente error: ${error}`,
      });
    }
  };
  getBy = async (req, res) => {
    try {
      const filtros = await this.limpiarCampos(req.body);
      const condiciones = [];
      // Filtro LIKE para 'apodo'
      if (filtros.apodo) {
        condiciones.push({
          apodo: { [Op.like]: `%${filtros.apodo}%` },
        });
        delete filtros.apodo;
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
      const usuarios = await this.usuarioSchema.findAll(opcionesConsulta);
      return res.status(200).json(usuarios);
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al consultar los usuarios: ${error}`,
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
    delete filtros.id_usuario;
    const resultado = await this.usuarioSchema.update(filtros, {
      where: { id_negocio: usuario.id_negocio, id_usuario: usuario.id_usuario },
    });
    return res.json({ type: "success", message: "Usuario modificado" });
  };

  login = async (req, res) => {
    const filtros = req.body;
    const usuario = await this.usuarioSchema.findOne({
      where: { apodo: filtros.apodo },
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
        message: `Apodo de usuario no registrado`,
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
    try {
      // Se busca al usuario por su id y id_negocio por la primary key compuesta
      const usuario = await this.usuarioSchema.findOne({
        where: {
          id_negocio: filtros.id_negocio,
          id_usuario: filtros.id_usuario,
        },
      });
      if (!usuario) return { type: "error", message: "Usuario no encontrado" };
      return usuario;
    } catch (error) {
      return res.status(200).json({
        type: "error",
        message: `Usuario no encontrado`,
      });
    }
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
  async existeApodo(apodo) {
    try {
      const usuario = await this.usuarioSchema.findOne({
        where: {
          apodo: apodo,
        },
      });
      if (usuario) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return {
        type: "error",
        message: "Error al consultar si ya existe apodo",
      };
    }
  }
}
