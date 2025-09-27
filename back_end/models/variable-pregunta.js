import { Sequelize, DataTypes, Op, where } from "sequelize";
import { sequelize } from "../config/database.js";

export const VariablePreguntaSchema = sequelize.define(
    "VariablePregunta",
    {
        id_variable_pregunta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre_variable_pregunta: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        valores: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true,
            defaultValue: [],
        },
        id_negocio: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        tipo_respuesta: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "sin_valor",
        },
        valor_respuesta: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        pregunta: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        variable_principal: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    },
    {
        tableName: "variable-pregunta",
        timestamps: false,
    }
);

export class VariablePreguntaModel {}
