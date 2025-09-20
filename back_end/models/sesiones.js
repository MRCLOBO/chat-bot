import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

export const SesionesSchema = sequelize.define(
    "Sesiones",
    {
        id_sesion: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sesion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        id_negocio: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fecha_inicio: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        estado: {
            type: DataTypes.ENUM(
                "En curso",
                "Finalizado",
                "Asistencia requerida"
            ),
            allowNull: false,
        },
        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        cantidad_mensajes: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false,
        },
    },
    {
        tableName: "sesiones",
        timestamps: false,
    }
);

export class SesionesModel {}
