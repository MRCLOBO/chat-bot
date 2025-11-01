import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

export const MateriaSchema = sequelize.define(
    "Materia",
    {
        id_materia: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre_materia: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        otro_nombre: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true,
            defaultValue: [],
        },
        id_negocio: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "materia",
        timestamps: false,
    }
);

export class MateriaModel {}
