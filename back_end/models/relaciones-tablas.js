import { AlumnoSchema } from "./alumno.js";
import { AnhoCarreraSchema } from "./anho_carrera.js";
import { AsistenteSchema } from "./asistente.js";
import { CarreraSchema } from "./carrera.js";
import { CategoriaSchema } from "./categoria.js";
import { CursoSchema } from "./curso.js";
import { HistorialConversacionSchema } from "./historial-conversacion.js";
import { MateriaSchema } from "./materia.js";
import { NegocioSchema } from "./negocios.js";
import { NotaSchema } from "./nota.js";
import { OrdenVentaSchema } from "./orden_venta.js";
import { OrdenVentaArticuloSchema } from "./orden_venta_articulo.js";
import { PreguntaAsistenteSchema } from "./preguntas-asistente.js";
import { ProductoSchema } from "./producto.js";
import { RespuestaAsistenteSchema } from "./respuesta-asistente.js";
import { TurnoCarreraSchema } from "./turno_carrera.js";

// Aquí ya están definidos, entonces se puede relacionar sin error
AsistenteSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasOne(AsistenteSchema, {
    foreignKey: "id_negocio",
    as: "asistente",
});

// Una pregunta puede tener muchas respuestas (una por negocio)
PreguntaAsistenteSchema.hasMany(RespuestaAsistenteSchema, {
    foreignKey: "id_pregunta",
    as: "respuestas",
});

CategoriaSchema.hasMany(ProductoSchema, {
    foreignKey: "id_categoria",
    as: "producto",
});

ProductoSchema.belongsTo(CategoriaSchema, {
    foreignKey: "id_categoria",
    as: "categoria",
});
// En modelo OrdenVenta
OrdenVentaSchema.hasMany(OrdenVentaArticuloSchema, {
    foreignKey: "id_orden_venta",
    onDelete: "CASCADE",
    as: "articulos",
});

// En modelo OrdenVentaArticulos
OrdenVentaArticuloSchema.belongsTo(OrdenVentaSchema, {
    foreignKey: "id_orden_venta",
    as: "orden",
});

HistorialConversacionSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasMany(HistorialConversacionSchema, {
    foreignKey: "id_negocio",
    as: "conversaciones",
});

AlumnoSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasMany(AlumnoSchema, {
    foreignKey: "id_negocio",
    as: "alumno",
});

AlumnoSchema.belongsTo(CursoSchema, {
    foreignKey: "id_curso",
    as: "curso",
});

CursoSchema.hasMany(AlumnoSchema, {
    foreignKey: "id_curso",
    as: "alumno",
});
NotaSchema.belongsTo(AlumnoSchema, {
    foreignKey: "id_alumno",
    as: "alumno",
});

AlumnoSchema.hasMany(NotaSchema, {
    foreignKey: "id_alumno",
    as: "nota",
});

AnhoCarreraSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasMany(AnhoCarreraSchema, {
    foreignKey: "id_negocio",
    as: "anho_carrera",
});
TurnoCarreraSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasMany(TurnoCarreraSchema, {
    foreignKey: "id_negocio",
    as: "turno_carrera",
});

CarreraSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasMany(CarreraSchema, {
    foreignKey: "id_negocio",
    as: "carrera",
});

CursoSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasMany(CursoSchema, {
    foreignKey: "id_negocio",
    as: "curso",
});

CursoSchema.belongsTo(AnhoCarreraSchema, {
    foreignKey: "id_anho",
    as: "anho_carrera",
});

AnhoCarreraSchema.hasMany(CursoSchema, {
    foreignKey: "id_anho",
    as: "curso",
});

CursoSchema.belongsTo(TurnoCarreraSchema, {
    foreignKey: "id_turno",
    as: "turno_carrera",
});

TurnoCarreraSchema.hasMany(CursoSchema, {
    foreignKey: "id_turno",
    as: "curso",
});

CursoSchema.belongsTo(CarreraSchema, {
    foreignKey: "id_carrera",
    as: "carrera",
});

CarreraSchema.hasMany(CursoSchema, {
    foreignKey: "id_carrera",
    as: "curso",
});

MateriaSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasMany(MateriaSchema, {
    foreignKey: "id_negocio",
    as: "materia",
});

NotaSchema.belongsTo(NegocioSchema, {
    foreignKey: "id_negocio",
    as: "negocio",
});

NegocioSchema.hasMany(NotaSchema, {
    foreignKey: "id_negocio",
    as: "nota",
});

NotaSchema.belongsTo(MateriaSchema, {
    foreignKey: "id_materia",
    as: "materia",
});

MateriaSchema.hasMany(NotaSchema, {
    foreignKey: "id_materia",
    as: "nota",
});
