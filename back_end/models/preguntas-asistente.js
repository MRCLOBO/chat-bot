import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PreguntaAsistenteSchema = sequelize.define(
     'PreguntaAsistente',
     {
          id_pregunta: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          pregunta: {
               type: DataTypes.TEXT,
               allowNull: false,
          },
          respuesta: {
               type: DataTypes.TEXT,
               allowNull: false,
               defaultValue: '',
          },
          intencion: {
               type: DataTypes.TEXT,
               allowNull: false,
          },
     },
     {
          tableName: 'pregunta-asistente',
          timestamps: false,
     }
);

export class PreguntaAsistenteModel {}
