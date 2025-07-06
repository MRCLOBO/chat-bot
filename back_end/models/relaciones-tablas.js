import { AsistenteSchema } from './asistente.js';
import { NegocioSchema } from './negocios.js';
import { PreguntaAsistenteSchema } from './preguntas-asistente.js';
import { RespuestaAsistenteSchema } from './respuesta-asistente.js';

// Aquí ya están definidos, entonces se puede relacionar sin error
AsistenteSchema.belongsTo(NegocioSchema, {
     foreignKey: 'id_negocio',
     as: 'negocio',
});

NegocioSchema.hasOne(AsistenteSchema, {
     foreignKey: 'id_negocio',
     as: 'asistente',
});

// Una pregunta puede tener muchas respuestas (una por negocio)
PreguntaAsistenteSchema.hasMany(RespuestaAsistenteSchema, {
     foreignKey: 'id_pregunta',
     as: 'respuestas',
});

// Cada respuesta pertenece a una pregunta
RespuestaAsistenteSchema.belongsTo(PreguntaAsistenteSchema, {
     foreignKey: 'id_pregunta',
     as: 'pregunta',
});
