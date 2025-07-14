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
               type: DataTypes.STRING,
               allowNull: false,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
               allowNull: true,
          },
          sinonimos: {
               type: DataTypes.ARRAY(DataTypes.TEXT),
               allowNull: true,
               defaultValue: [],
          },
          contexto_entrada: {
               type: DataTypes.ARRAY(DataTypes.TEXT),
               allowNull: true,
               defaultValue: [],
          },
          contexto_salida: {
               type: DataTypes.ARRAY(DataTypes.TEXT),
               allowNull: true,
               defaultValue: [],
          },
          variables_pregunta: {
               type: DataTypes.ARRAY(DataTypes.TEXT),
               allowNull: true,
               defaultValue: [],
          },
          webhook: {
               type: DataTypes.BOOLEAN,
               allowNull: false,
               defaultValue: false,
          },
     },
     {
          tableName: 'pregunta-asistente',
          timestamps: false,
     }
);

export class PreguntaAsistenteModel {}
