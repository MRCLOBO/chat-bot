import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';
import { NegocioSchema } from './negocios.js';

export const TiendaSchema = sequelize.define(
     'Tienda',
     {
          id_tienda: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          id_publico: {
               type: DataTypes.STRING,
               unique: true,
               allowNull: false,
          },
          color_principal: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          color_fondo: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          color_descuento: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          mostrar_imagenes_promocionales: {
               type: DataTypes.BOOLEAN,
               defaultValue: false,
               allowNull: false,
          },
          imagenes_promocionales: {
               type: DataTypes.ARRAY(DataTypes.TEXT),
               allowNull: true,
               defaultValue: [],
          },
          mostrar_articulos_destacados: {
               type: DataTypes.BOOLEAN,
               defaultValue: false,
               allowNull: false,
          },
          articulos_destacados: {
               type: DataTypes.ARRAY(DataTypes.INTEGER),
               allowNull: true,
               defaultValue: [],
          },
          mostrar_hora_oferta: {
               type: DataTypes.BOOLEAN,
               defaultValue: false,
               allowNull: false,
          },
          inicio_hora_oferta: {
               type: DataTypes.DATE,
               allowNull: true,
          },
          fin_hora_oferta: {
               type: DataTypes.DATE,
               allowNull: true,
          },
          banner_oferta: {
               type: DataTypes.STRING,
               allowNull: true,
          },
     },
     {
          tableName: 'tienda',
          timestamps: false,
     }
);

export class TiendaModel {}
