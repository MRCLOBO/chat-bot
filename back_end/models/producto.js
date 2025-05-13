import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

export const ProductoSchema = sequelize.define(
  "Producto",
  {
    id_producto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_producto: {
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
    cantidad: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    consultas: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    precio: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    foto_producto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "producto",
    timestamps: false,
  }
);

export class ProductoModel {}
