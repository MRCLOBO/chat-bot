import { Op, where } from "sequelize";
import { NegocioSchema } from "../models/negocios.js";
import {
    OrdenVentaArticuloModel,
    OrdenVentaArticuloSchema,
} from "../models/orden_venta_articulo.js";

export class OrdenVentaController {
    constructor(ordenVentaModel, ordenVentaSchema) {
        this.ordenVentaModel = ordenVentaModel;
        this.ordenVentaSchema = ordenVentaSchema;
        this.NegocioSchema = new NegocioSchema();
    }
    getAll = async (req, res) => {
        const ordenVenta = await this.ordenVentaSchema.findAll();
        return res.status(200).json(ordenVenta);
    };

    create = async (req, res) => {
        try {
            const { nuevaOrdenVenta, articulos } = req.body;
            const idOrdenVenta = await this.obtenerUltimoID();
            nuevaOrdenVenta["id_orden_venta"] = idOrdenVenta;

            const respuestaBD = await this.ordenVentaSchema.create(
                nuevaOrdenVenta
            );
            for (const articulo of articulos) {
                const nuevoArticuloOrdenVenta = {
                    id_orden_venta_articulo:
                        await this.obtenerUltimoIDOrdenVentaArticulo(),
                    id_orden_venta: idOrdenVenta,
                    id_negocio: articulo.id_negocio,
                    id_articulo: articulo.id_articulo,
                    precio: articulo.precio,
                    cantidad: articulo.cantidad,
                    nombre_articulo: articulo.nombre_articulo,
                };
                const respuestaArticulo = await OrdenVentaArticuloSchema.create(
                    nuevoArticuloOrdenVenta
                );
            }

            return res.status(200).json({
                type: "success",
                message: "Orden de venta creada con exito!",
                bd: respuestaBD,
            });
        } catch (error) {
            res.status(500).json({
                type: "error",
                message: `Error al crear la categoria por el siguiente error: ${error}`,
            });
        }
    };

    getBy = async (req, res) => {
        try {
            const filtros = await this.limpiarCampos(req.body);
            const condiciones = [];
            // Filtro LIKE para 'nombre'
            if (filtros.nombre_cliente) {
                condiciones.push({
                    nombre_cliente: {
                        [Op.like]: `%${filtros.nombre_cliente}%`,
                    },
                });
                delete filtros.nombre_cliente;
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
                include: [
                    {
                        model: OrdenVentaArticuloSchema,
                        as: "articulos", // mismo alias que definiste en la relación
                    },
                ],
            };
            if (campoOrden && tipoOrden) {
                opcionesConsulta.order = [[campoOrden, tipoOrden]];
            }
            const productos = await this.ordenVentaSchema.findAll(
                opcionesConsulta
            );
            return res.status(200).json(productos);
        } catch (error) {
            res.status(500).json({
                type: "error",
                message: `Error al consultar las ordenes de venta: ${error}`,
            });
        }
    };
    getAllBy = async (req, res) => {
        try {
            const filtros = await this.limpiarCampos(req.body);
            const condiciones = [];

            // 1. Filtro por fechas si vienen
            const fechaDesde = filtros.fecha_desde;
            const fechaHasta = filtros.fecha_hasta;

            if (fechaDesde || fechaHasta) {
                const rangoFechas = {};
                if (fechaDesde) {
                    rangoFechas[Op.gte] = new Date(fechaDesde);
                }
                if (fechaHasta) {
                    rangoFechas[Op.lte] = new Date(fechaHasta);
                }
                condiciones.push({ fecha_creacion: rangoFechas });

                // Eliminar los campos especiales para que no entren en el for
                delete filtros.fecha_desde;
                delete filtros.fecha_hasta;
            }

            // 2. Recorrer los demás filtros normales
            for (const key in filtros) {
                const valor = filtros[key];

                if (Array.isArray(valor)) {
                    condiciones.push({ [key]: { [Op.in]: valor } });
                } else if (
                    typeof valor === "object" &&
                    valor.operador &&
                    valor.valor !== undefined
                ) {
                    let operadorSequelize;
                    switch (valor.operador) {
                        case "gt":
                            operadorSequelize = Op.gt;
                            break;
                        case "gte":
                            operadorSequelize = Op.gte;
                            break;
                        case "lt":
                            operadorSequelize = Op.lt;
                            break;
                        case "lte":
                            operadorSequelize = Op.lte;
                            break;
                        case "ne":
                            operadorSequelize = Op.ne;
                            break;
                        default:
                            operadorSequelize = Op.eq;
                            break;
                    }

                    condiciones.push({
                        [key]: { [operadorSequelize]: valor.valor },
                    });
                } else {
                    condiciones.push({ [key]: valor });
                }
            }

            const opcionesConsulta = {
                where: { [Op.and]: condiciones },
            };

            const ordenes = await this.ordenVentaSchema.findAll(
                opcionesConsulta
            );

            return res.status(200).json(ordenes);
        } catch (error) {
            res.status(500).json({
                type: "error",
                message: `Error al consultar órdenes de venta: ${error}`,
            });
        }
    };

    delete = async (req, res) => {
        try {
            const ordenVenta = await this.getOrdenVenta(req.body);
            await ordenVenta.destroy();
            res.json({ mensaje: "Orden de venta eliminada correctamente" });
        } catch (error) {
            res.status(500).json({
                type: "error",
                message: `Error al eliminar la orden de venta por el siguiente error: ${error}`,
            });
        }
    };

    update = async (req, res) => {
        const ordenVenta = await this.getOrdenVenta(req.body);
        const filtros = await this.limpiarCampos(req.body);
        delete filtros.id_orden_venta;
        const resultado = await this.ordenVentaSchema.update(filtros, {
            where: {
                id_negocio: ordenVenta.id_negocio,
                id_orden_venta: ordenVenta.id_orden_venta,
            },
        });
        return res.json({
            type: "success",
            message: "Orden de venta modificada",
        });
    };

    async limpiarCampos(filtros) {
        //Se elimina todo aquel campo que tenga como valor "null"
        const filtrosLimpios = Object.fromEntries(
            Object.entries(filtros).filter(([_, value]) => value !== null)
        );
        return filtrosLimpios;
    }

    async getOrdenVenta(filtros) {
        try {
            // Se busca al producto por su id y id_negocio por la primary key compuesta
            const ordenVenta = await this.ordenVentaSchema.findOne({
                where: {
                    id_negocio: filtros.id_negocio,
                    id_orden_venta: filtros.id_orden_venta,
                },
            });
            if (!ordenVenta)
                return {
                    type: "error",
                    message: "Orden de venta no encontrada",
                };
            return ordenVenta;
        } catch (error) {
            return {
                type: "error",
                message: `Orden de venta no encontrada`,
            };
        }
    }
    async obtenerUltimoID() {
        try {
            const ultimoRegistro = await this.ordenVentaSchema.findOne({
                order: [["id_orden_venta", "DESC"]],
            });
            if (ultimoRegistro) {
                return ultimoRegistro.id_orden_venta + 1;
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
    async obtenerUltimoIDOrdenVentaArticulo() {
        try {
            const ultimoRegistro = await OrdenVentaArticuloSchema.findOne({
                order: [["id_orden_venta_articulo", "DESC"]],
            });
            if (ultimoRegistro) {
                return ultimoRegistro.id_orden_venta_articulo + 1;
            } else {
                return 1;
            }
        } catch (error) {
            return {
                type: "error",
                message:
                    "Error al recuperar el ultimo ID de articulo de la tabla",
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
