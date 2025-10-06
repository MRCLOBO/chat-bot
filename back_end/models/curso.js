import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const CursoSchema = sequelize.define(
     'Curso',
     {
          id_curso: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          nombre_curso: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          abreviatura_curso: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          id_carrera: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          id_turno: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          id_anho: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          mensualidad: {
               type: DataTypes.INTEGER,
               allowNull: false,
               defaultValue: 0,
          },
          matricula: {
               type: DataTypes.INTEGER,
               allowNull: false,
               defaultValue: 0,
          },
     },
     {
          tableName: 'curso',
          timestamps: false,
     }
);

export class CursoModel {}
