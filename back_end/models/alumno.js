import { Sequelize, DataTypes, Op, where } from 'sequelize';
import { sequelize } from '../config/database.js';

export const AlumnoSchema = sequelize.define(
     'Alumno',
     {
          id_alumno: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
          },
          nombre_alumno: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          id_negocio: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          ci: {
               type: DataTypes.STRING,
               allowNull: false,
          },
          id_curso: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          ultima_cuota_pendiente: {
               type: DataTypes.STRING,
               allowNull: true,
          },
          monto_ultima_cuota_pendiente: {
               type: DataTypes.INTEGER,
               allowNull: true,
          },
          horas_capacitacion: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          horas_extension: {
               type: DataTypes.INTEGER,
               allowNull: false,
          },
          imagen: {
               type: DataTypes.STRING,
               allowNull: true,
          },
     },
     {
          tableName: 'alumno',
          timestamps: false,
     }
);

export class AlumnoModel {}
