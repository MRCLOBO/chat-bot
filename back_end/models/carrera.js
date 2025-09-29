import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const CarreraSchema = sequelize.define(
     'Carrera',
     {
          id_carrera: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          nombre_carrera: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          otro_nombre: {
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
          tableName: 'carrera',
          timestamps: false,
     }
);

export class CarreraModel {}
