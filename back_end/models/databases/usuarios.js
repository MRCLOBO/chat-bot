import { createRequire } from "node:module";
const require = createRequire(import.meta.url); //aqui le paso por parametro la ruta actual del archivo para que ejecuta todos los requires a partir de aqui
const { Pool } = require("pg");

const pool = new Pool({});

export class UsuarioModel {
  static async getAll(parametro) {
    let usuariosResultado;
    if (parametro) {
      const idAccesorio = await this.getIDAccesorio(parametro);
      const consulta2 =
        "SELECT usuario_id from usuario_accesorio where accesorio_id = $1";
      const idAccesorioArray = [idAccesorio];
      const usuariosConAccesorio = await pool.query(
        consulta2,
        idAccesorioArray
      );
      let idUsuarios = [];
      for (let i = 0; i < usuariosConAccesorio.rows.length; i++) {
        idUsuarios.push(usuariosConAccesorio.rows[i].usuario_id);
      }

      let parametrosConsulta3 = ``;
      for (let i = 1; i <= idUsuarios.length; i++) {
        if (i == 1) {
          parametrosConsulta3 += `$${i}`;
        } else {
          parametrosConsulta3 += `,$${i}`;
        }
      }
      const consulta3 = `SELECT * from usuario where id in(${parametrosConsulta3})`;
      usuariosResultado = await pool.query(consulta3, idUsuarios);
    } else {
      usuariosResultado = await pool.query("select * from usuario"); // solicitamos a la BD
    }
    return usuariosResultado.rows; //Enviamos las filas que da el resultado
  }
  static async getById(id) {
    const consulta = "SELECT * from usuario where id = $1";
    const resultado = await pool.query(consulta, [id]);
    return resultado.rows;
  }
  static async getIDAccesorio(accesorio) {
    const consulta1 = "SELECT id from accesorio where name = $1";
    const idAccesorio = await pool.query(consulta1, [accesorio]);
    return idAccesorio.rows[0].id;
  }
  static async create(input) {
    const { nombre, accesorios, estudiante } = input;
    const consultaUsuario =
      "insert into usuario(nombre,estudiante) values ($1,$2)";
    const agregarUsuario = await pool.query(consultaUsuario, [
      nombre,
      estudiante,
    ]);
    const idAccesorio = await this.getIDAccesorio(accesorios[0]);
    const idUsuario = await pool.query(
      "SELECT id from usuario where nombre = $1",
      [nombre]
    );
    const consultaAccesorio = await pool.query(
      "insert into usuario_accesorio(usuario_id,accesorio_id) values($1,$2)",
      [(await idUsuario).rows[0].id, idAccesorio]
    );
    return { message: "Usuario agregado con exito" };
  }
  static async delete(id) {
    try {
      const usuarioEliminado = await pool.query(
        "DELETE FROM usuario where id = $1",
        [id]
      );
    } catch (e) {
      return { message: "ocurrio un error al eliminar el usuario" };
    }
    return true;
  }
  static async update(id, input) {
    const { nombre, estudiante } = input;
    if (nombre != false && estudiante == null) {
      const consulta = await pool.query(
        "UPDATE  usuario set nombre = $1 where id = $2",
        [nombre, id]
      );
      return true;
    } else if (estudiante != false && nombre == null) {
      const consulta = await pool.query(
        "UPDATE usuario set estudiante = $1 where id = $2",
        [estudiante, id]
      );
      return true;
    } else if (nombre != false && estudiante != false) {
      const consulta = await pool.query(
        "UPDATE  usuario set nombre = $1,estudiante = $2 where id = $3",
        [nombre, estudiante, id]
      );
      return true;
    } else {
      return false;
    }
  }
}
