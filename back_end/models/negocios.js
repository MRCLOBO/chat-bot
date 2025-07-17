import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';
import { AsistenteSchema } from './asistente.js';

export const NegocioSchema = sequelize.define(
     'Negocio',
     {
          id_negocio: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          nombre_negocio: {
               type: DataTypes.STRING,
               allowNull: false,
               unique: true,
          },
          direccion: {
               type: DataTypes.STRING,
               allowNull: true,
          },
          email: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          propietario: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          logo_negocio: {
               type: DataTypes.STRING,
               allowNull: true,
          },
          tipo_negocio: {
               type: DataTypes.ENUM('servicios', 'productos', 'ambos'),
               allowNull: false,
               unique: false,
          },
          telefono: {
               type: DataTypes.STRING,
               allowNull: true,
          },
          api_key: {
               type: DataTypes.TEXT,
               allowNull: false,
          },
          id_publico: {
               type: DataTypes.TEXT,
               allowNull: false,
          },
     },
     {
          tableName: 'negocio',
          timestamps: false,
     }
);
export class NegocioModel {}
