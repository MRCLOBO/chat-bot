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

export class UsuarioModel {}
