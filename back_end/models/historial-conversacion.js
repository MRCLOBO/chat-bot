import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const HistorialConversacionSchema = sequelize.define(
     'HistorialConversacion',
     {
          id_historial_conversacion: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          sesion: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          remitente: {
               type: DataTypes.ENUM('cliente', 'asistente'),
               allowNull: false,
          },
          mensaje: {
               type: DataTypes.TEXT,
               allowNull: false,
          },
          fecha_mensaje: {
               type: DataTypes.DATE,
               allowNull: false,
          },
     },
     {
          tableName: 'historial_conversacion',
          timestamps: false,
     }
);

export class HistorialConversacionModel {}
