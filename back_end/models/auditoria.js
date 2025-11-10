import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const AuditoriaSchema = sequelize.define(
     'Auditoria',
     {
          id_auditoria: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          nombre_tabla: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          operacion: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
          },
          id_registro: {
               type: DataTypes.STRING,
          },
          datos_antes: {
               type: DataTypes.JSONB,
               allowNull: true,
          },
          datos_despues: {
               type: DataTypes.JSONB,
               allowNull: true,
          },
          usuario: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          fecha: {
               type: DataTypes.DATE,
               allowNull: false,
          },
     },
     {
          tableName: 'auditoria',
          timestamps: false,
     }
);

export class AuditoriaModel {}
