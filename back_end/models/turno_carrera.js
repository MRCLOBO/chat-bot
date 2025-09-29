import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const TurnoCarreraSchema = sequelize.define(
     'Turno_Carrera',
     {
          id_turno_carrera: {
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
          horario_desde: {
               type: DataTypes.TIME,
               allowNull: false,
          },
          horario_hasta: {
               type: DataTypes.TIME,
               allowNull: false,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
     },
     {
          tableName: 'turno_carrera',
          timestamps: false,
     }
);

export class TurnoCarreraModel {}
