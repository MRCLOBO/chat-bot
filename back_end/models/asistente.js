import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';
import { NegocioSchema } from './negocios.js';

export const AsistenteSchema = sequelize.define(
     'Asistente',
     {
          id_asistente: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
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
          descripcion: {
               type: DataTypes.TEXT,
               defaultValue: '',
          },

          color1: {
               type: DataTypes.TEXT,
               allowNull: false,
               defaultValue: '',
          },

          color2: {
               type: DataTypes.TEXT,
               defaultValue: '',
          },
          color3: {
               type: DataTypes.TEXT,
               defaultValue: '',
          },
          imagen: {
               type: DataTypes.TEXT,
               defaultValue: '',
          },
     },
     {
          tableName: 'asistente',
          timestamps: false,
     }
);

export class AsistenteModel {}
