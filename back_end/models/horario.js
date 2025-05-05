import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

//Los horarios se mantienen en una tabla independiente ya que se tomara en cuenta todos los dias y mejorara la logica para tener varias empresas en el sistema
export const HorarioSchema = sequelize.define(
  "Horario",
  {
    id_horario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_negocio: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    nombre_negocio: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    dia: {
      type: DataTypes.ENUM(
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado",
        "Domingo"
      ),
      allowNull: false,
    },
    apertura: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    cierre: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    tableName: "horario",
    timestamps: false,
  }
);

export class HorarioModel {}
