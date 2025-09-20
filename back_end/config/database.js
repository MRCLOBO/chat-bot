import { Sequelize } from "sequelize";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const dotenv = require("dotenv").config();

export const sequelize = new Sequelize(
    // LOCAL
    process.env.DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    { host: process.env.HOST, dialect: "postgres" }

    // PRODUCCION
    // process.env.DATABASE_URL_PROD,
    // {
    //     dialect: "postgres",
    //     dialectOptions: { ssl: true },
    // } // Neon requiere SSL
);

export async function conectarBD() {
    try {
        await sequelize.authenticate();
        console.log(" Conexion a la base de datos exitosa! ");
    } catch (error) {
        console.error("Error al conectar con la BD: ", error);
    }
}
