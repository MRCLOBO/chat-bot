import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const VentasSchema = sequelize.define(
     'Ventas',
     {
          id_venta: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          monto_total: {
               type: DataTypes.INTEGER,
               allowNull: false,
               defaultValue: 0,
          },
          fecha_creacion: {
               type: DataTypes.DATE,
               allowNull: false,
          },
          nombre_cliente: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          celular_cliente: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          informacion_adicional: {
               type: DataTypes.TEXT,
               allowNull: true,
               defaultValue: '',
          },
          estado: {
               type: DataTypes.BOOLEAN,
               allowNull: true,
               defaultValue: null,
          },
          id_orden_venta: {
               type: DataTypes.INTEGER,
               allowNull: true,
          },
          direccion: {
               type: DataTypes.STRING,
               allowNull: true,
          },
          ciudad: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          documento_cliente: {
               type: DataTypes.STRING,
               allowNull: false,
               defaultValue: 'X',
          },
          informacion_pago: {
               type: DataTypes.STRING,
               allowNull: false,
          },
     },
     {
          tableName: 'ventas',
          timestamps: false,
     }
);

export class VentasModel {}
