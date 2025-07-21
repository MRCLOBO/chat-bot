import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const OrdenVentaSchema = sequelize.define(
     'OrdenVenta',
     {
          id_orden_venta: {
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
     },
     {
          tableName: 'orden_venta',
          timestamps: false,
     }
);

export class OrdenVentaModel {}
