import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const OrdenVentaArticuloSchema = sequelize.define(
     'OrdenVentaArticulo',
     {
          id_orden_venta_articulo: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          id_orden_venta: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          id_articulo: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          precio: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          cantidad: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          nombre_articulo: {
               type: DataTypes.TEXT,
               allowNull: false,
          },
     },
     {
          tableName: 'orden_venta_articulo',
          timestamps: false,
     }
);

export class OrdenVentaArticuloModel {}
