import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

export const UsuarioSchema = sequelize.define(
  "Usuario",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_usuario: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    id_negocio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    nombre_negocio: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    rol: {
      type: DataTypes.ENUM("admin", "propietario", "usuario"),
      allowNull: false,
      unique: false,
      defaultValue: "usuario",
    },
    contrasena: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
  },
  {
    tableName: "usuarios",
    timestamps: false,
  }
);

export class UsuarioModel {
  // static create = async (nuevoUsuario) => {
  //   try {
  //     nuevoUsuario.id_usuario = await this.obtenerUltimoID(
  //       nuevoUsuario.id_negocio
  //     );
  //     await this.usuarioSchema.create(nuevoUsuario);
  //     return { type: "success", message: "¡Usuario creado con exito!" };
  //   } catch (error) {
  //     return {
  //       type: "error",
  //       message: `Error al crear el usuario por el siguiente error: ${error}`,
  //     };
  //   }
  // };
  // static getBy = async (filtros) => {
  //   try {
  //     // Filtrar las claves con valores null
  //     const filtrosLimpios = await this.limpiarCampos(filtros);
  //     const usuarios = await this.usuarioSchema.findAll({
  //       where: {
  //         [Op.and]: filtrosLimpios,
  //       },
  //     });
  //     return usuarios;
  //   } catch (error) {
  //     return {
  //       type: "error",
  //       message: `Error al consultar los usuarios por el siguiente error: ${error}`,
  //     };
  //   }
  // };
  // static delete = async (usuario) => {
  //   try {
  //     const eliminarUsuario = await this.getUsuario(usuario);
  //     await eliminarUsuario.destroy();
  //     return { type: "success", message: "Usuario eliminado correctamente" };
  //   } catch (error) {
  //     return {
  //       type: "error",
  //       message: `Error al eliminar al usuario por el siguiente error: ${error}`,
  //     };
  //   }
  // };
  // static update = async (datosUsuario) => {
  //   const usuario = await this.getUsuario(datosUsuario);
  //   const filtros = await this.limpiarCampos(datosUsuario);
  //   await usuario.update(filtros);
  // };
  // static login = async (filtros) => {
  //   const usuario = await this.usuarioSchema.findOne({
  //     where: { nombre_usuario: filtros.nombre_usuario },
  //   });
  //   if (usuario) {
  //     if (usuario.contrasena === filtros.contrasena) {
  //       usuario.contrasena = null;
  //       return usuario;
  //     }
  //     if (usuario.contrasena !== filtros.contrasena) {
  //       return {
  //         type: "error",
  //         message: `Contraseña incorrecta, intentelo de nuevo`,
  //       };
  //     }
  //   } else {
  //     return {
  //       type: "error",
  //       message: `Nombre de usuario no registrado`,
  //     };
  //   }
  // };
  // async limpiarCampos(filtros) {
  //   //Se elimina todo aquel campo que tenga como valor "null"
  //   const filtrosLimpios = Object.fromEntries(
  //     Object.entries(filtros).filter(([_, value]) => value !== null)
  //   );
  //   return filtrosLimpios;
  // }
  // async getUsuario(filtros) {
  //   // Se busca al usuario por su id y id_negocio por la primary key compuesta
  //   const usuario = await UsuarioSchema.findByPk(
  //     filtros.id_usuario,
  //     where(col("id_negocio"), Op.eq, filtros.id_negocio)
  //   );
  //   if (!usuario) return { type: "error", message: "Usuario no encontrado" };
  //   return usuario;
  // }
  // async obtenerUltimoID(id_negocio) {
  //   try {
  //     const ultimoRegistro = await UsuarioSchema.findOne({
  //       order: [["id_usuario", "DESC"]],
  //       where: {
  //         id_negocio: id_negocio,
  //       },
  //     });
  //     if (ultimoRegistro) {
  //       return ultimoRegistro.id_usuario + 1;
  //     } else {
  //       return 1;
  //     }
  //   } catch (error) {
  //     return {
  //       type: "error",
  //       message: "Error al recuperar el ultimo ID de la tabla",
  //     };
  //   }
  // }
}
