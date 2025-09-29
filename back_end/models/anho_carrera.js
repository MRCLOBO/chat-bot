import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const AnhoCarreraSchema = sequelize.define(
     'Anho_carrera',
     {
          id_anho_carrera: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          denominacion: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          otra_denominacion: {
               type: DataTypes.ARRAY(DataTypes.TEXT),
               allowNull: true,
               defaultValue: [],
          },
          abreviatura: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
     },
     {
          tableName: 'anho_carrera',
          timestamps: false,
     }
);

export class AnhoCarreraModel {}
