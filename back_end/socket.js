// sockets.js
export default function registerSockets(io, { controller }) {
     io.on('connection', (socket) => {
          console.log('Cliente conectado:', socket.id);

          // 🔹 Unirse a una sala por sessionID
          socket.on('chat:join', ({ sessionID }) => {
               if (!sessionID) return;
               socket.join(sessionID);
               console.log(
                    `Cliente ${socket.id} se unió a la sala ${sessionID}`
               );
               socket.emit('chat:joined', { ok: true, sessionID });
          });

          // 🔹 Recibir la consulta del cliente
          socket.on('chat:consulta', async (payload, ack) => {
               try {
                    const resultado = await controller.consulta(payload);

                    // Emitir la respuesta solo a la sala de esa sesión
                    io.to(payload.sessionID).emit('chat:message', {
                         from: 'bot',
                         contenido: resultado.respuestaBOT,
                         ts: Date.now(),
                    });

                    if (typeof ack === 'function') ack(resultado);
               } catch (error) {
                    console.error('Error en chat:consulta:', error);
                    if (typeof ack === 'function') {
                         ack({ type: 'error', message: 'Error en servidor' });
                    } else {
                         socket.emit(
                              'chat:error',
                              'No se pudo procesar la consulta'
                         );
                    }
               }
          });
     });
}
