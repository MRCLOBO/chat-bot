import { AsistenteSchema } from './asistente.js';
import { NegocioSchema } from './negocios.js';

// Aquí ya están definidos, entonces se puede relacionar sin error
AsistenteSchema.belongsTo(NegocioSchema, {
     foreignKey: 'id_negocio',
     as: 'negocio',
});

NegocioSchema.hasOne(AsistenteSchema, {
     foreignKey: 'id_negocio',
     as: 'asistente',
});
