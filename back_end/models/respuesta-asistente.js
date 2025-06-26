import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

export const RespuestaAsistenteSchema = sequelize.define(
    "RespuestaAsistente",
    {
        id_respuesta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id_asistente: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        nombre_asistente: {
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
        respuesta: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
        },
    },
    {
        tableName: "respuesta-asistente",
        timestamps: false,
    }
);

export class RespuestaAsistenteModel {}
