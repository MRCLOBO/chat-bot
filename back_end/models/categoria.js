import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

export const CategoriaSchema = sequelize.define(
  "Categoria",
  {
    id_categoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_categoria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_negocio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    nombre_negocio: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
  },
  {
    tableName: "categoria",
    timestamps: false,
  }
);

export class CategoriaModel {}
