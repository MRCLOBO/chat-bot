import { Op, where, fn, col } from "sequelize";
import { NegocioSchema } from "../models/negocios.js";

export class MateriaController {
    constructor(materiaModel, materiaSchema) {
        this.modelo = materiaModel;
        this.schema = materiaSchema;
        this.NegocioSchema = new NegocioSchema();
    }

    create = async (req, res) => {
        try {
            const nuevo = req.body;
            nuevo["id_materia"] = await this.obtenerUltimoID();

            const respuestaBD = await this.schema.create(nuevo);
            return res.status(200).json({
                type: "success",
                message: "Registrado con exito!",
                bd: respuestaBD,
            });
        } catch (error) {
            res.status(500).json({
                type: "error",
                message: `Error al crear el registro por el siguiente error: ${error}`,
            });
            console.error(error);
        }
    };
    getBy = async (req, res) => {
        try {
            const filtros = await this.limpiarCampos(req.body);
            const condiciones = [];
            // Filtro LIKE para 'nombre'
            if (filtros.nombre_materia) {
                condiciones.push({
                    nombre_materia: {
                        [Op.like]: `%${filtros.nombre_materia}%`,
                    },
                });
                delete filtros.nombre_materia;
            }
            // Extraer los valores de ordenamiento y eliminarlos del objeto de filtros
            const campoOrden = filtros.orden;
            const tipoOrden = filtros.tipo_orden;
            delete filtros.orden;
            delete filtros.tipo_orden;
            // Resto de filtros exactos
            for (const key in filtros) {
                condiciones.push({ [key]: filtros[key] });
            }
            // Armar la consulta con ordenamiento si aplica
            const opcionesConsulta = {
                where: { [Op.and]: condiciones },
            };
            if (campoOrden && tipoOrden) {
                opcionesConsulta.order = [[campoOrden, tipoOrden]];
            }
            const materias = await this.schema.findAll({
                ...opcionesConsulta,
                include: [
                    {
                        model: NegocioSchema,
                        as: "negocio",
                        attributes: { exclude: ["api_key"] },
                    },
                ],
            });
            return res.status(200).json(materias);
        } catch (error) {
            res.status(500).json({
                type: "error",
                message: `Error al consultar los datos registrados: ${error}`,
            });
        }
    };

    delete = async (req, res) => {
        try {
            const registro = await this.getRegistro(req.body);
            await registro.destroy();
            res.json({ mensaje: "Eliminado correctamente" });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                type: "error",
                message: `Error al eliminar el registro por el siguiente error: ${error}`,
            });
        }
    };

    update = async (req, res) => {
        const registro = await this.getRegistro(req.body);
        const filtros = await this.limpiarCampos(req.body);
        const resultado = await this.schema.update(filtros, {
            where: {
                id_materia: registro.id_materia,
            },
        });
        return res.json({ type: "success", message: "Registro Modificado" });
    };

    async limpiarCampos(filtros) {
        //Se elimina todo aquel campo que tenga como valor "null"
        const filtrosLimpios = Object.fromEntries(
            Object.entries(filtros).filter(([_, value]) => value !== null)
        );
        return filtrosLimpios;
    }

    async getRegistro(filtros) {
        try {
            // Se busca el registro por su id y id_negocio por la primary key compuesta
            const registro = await this.schema.findOne({
                where: {
                    id_materia: filtros.id_materia,
                },
            });
            if (!registro)
                return {
                    type: "error",
                    message: "Registro encontrado",
                };
            return registro;
        } catch (error) {
            return res.status(200).json({
                type: "error",
                message: `Registro no encontrado`,
            });
        }
    }
    async obtenerUltimoID() {
        try {
            const ultimoRegistro = await this.schema.findOne({
                order: [["id_materia", "DESC"]],
            });
            if (ultimoRegistro) {
                return ultimoRegistro.id_materia + 1;
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
    async getNegocio(idNegocio) {
        try {
            const negocio = await NegocioSchema.findByPk(idNegocio);
            if (!negocio)
                return { type: "error", message: "Negocio no encontrado" };
            return negocio;
        } catch (error) {
            return {
                type: "error",
                message: "Error al recuperar la informacion del negocio",
                error: error,
            };
        }
    }
}
