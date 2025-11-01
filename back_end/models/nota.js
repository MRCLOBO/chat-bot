import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

export const NotaSchema = sequelize.define(
    "Nota",
    {
        id_nota: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id_materia: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_negocio: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_alumno: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        nota: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: "nota",
        timestamps: false,
    }
);

export class NotaModel {}
