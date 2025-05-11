import { Op, where } from "sequelize";
export class HorarioController {
  constructor(horarioModel, horarioSchema) {
    this.horarioModel = horarioModel;
    this.horarioSchema = horarioSchema;
  }

  create = async (req, res) => {
    try {
      const nuevoHorario = req.body;
      const respuestaBD = await this.horarioSchema.create(nuevoHorario);
      return res.status(200).json({
        type: "success",
        message: "¡Horario registrado!",
        bd: respuestaBD,
      });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al registrar el horario por el siguiente error: ${error}`,
      });
    }
  };
  getBy = async (req, res) => {
    try {
      const filtros = await this.limpiarCampos(req.body);
      let horarios = [];
      if (filtros != []) {
        horarios = await this.horarioSchema.findAll({
          where: {
            [Op.and]: filtros,
          },
        });
      } else {
        horarios = await this.horarioSchema.findAll();
      }
      return res.status(200).json(horarios);
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al consultar los horarios por el siguiente error: ${error}`,
      });
    }
  };

  delete = async (req, res) => {
    try {
      const horario = await this.getHorario(req.body);
      await horario.destroy();
      res.json({ mensaje: "Horario eliminado correctamente" });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: `Error al eliminar el horario por el siguiente error: ${error}`,
      });
    }
  };

  update = async (req, res) => {
    const horario = await this.getHorario(req.body);
    const filtros = await this.limpiarCampos(req.body);
    delete filtros.id_negocio;
    const resultado = await this.horarioSchema.update(filtros, {
      where: { id_negocio: horario.id_negocio, id_horario: horario.id_horario },
    });
    return res.json({ type: "success", message: "Horario modificado" });
  };

  async limpiarCampos(filtros) {
    //Se elimina todo aquel campo que tenga como valor "null"
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(([_, value]) => value !== null)
    );
    return filtrosLimpios;
  }

  async getHorario(filtros) {
    const horario = await this.horarioSchema.findOne({
      where: { id_negocio: filtros.id_negocio, id_horario: filtros.id_horario },
    });
    if (!horario) return { type: "error", message: "Horario no encontrado" };
    return horario;
  }
  async obtenerUltimoID(id_negocio) {
    try {
      const ultimoRegistro = await this.horarioSchema.findOne({
        order: [["id_horario", "DESC"]],
        where: {
          id_negocio: id_negocio,
        },
      });
      if (ultimoRegistro) {
        return ultimoRegistro.id_horario + 1;
      } else {
        return 1;
      }
    } catch (error) {
      return {
        type: "error",
        message: "Error al recuperar el ultimo ID de la tabla",
      };
    }
  }
}
