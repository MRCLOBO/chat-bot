// sockets.js
export default function registerSockets(io, { controller }) {
     io.on('connection', (socket) => {
          console.log('Cliente conectado:', socket.id);

          // 🔹 Unirse a una sala por sessionID
          socket.on('chat:join', ({ sessionID }) => {
               if (!sessionID) return;
               let estado = 'En curso';
               socket.join(sessionID);
               console.log(
                    `Cliente ${socket.id} se unió a la sala ${sessionID}`
               );
               socket.emit('chat:joined', { ok: true, sessionID });
          });

          socket.on('chat:leave', ({ sessionID }) => {
               if (!sessionID) return;
               socket.leave(sessionID);
               console.log(
                    `Usuario ${socket.id} salió de la sala ${sessionID}`
               );
          });

          // 🔹 Recibir la consulta del cliente
          socket.on('chat:consulta', async (payload, ack) => {
               try {
                    const {
                         sessionID,
                         consultaUsuario,
                         infoAsistente,
                         esInicioConversacion,
                         usarIA,
                    } = payload;
                    // 🔹 Emitir actualización para el monitor de chats
                    io.emit('chat:actualizado', {
                         id_historial_conversacion: 0,
                         sesion: sessionID,
                         id_negocio: infoAsistente.id_negocio,
                         remitente: 'cliente',
                         mensaje: consultaUsuario,
                         fecha_mensaje: new Date(),
                    });
                    if (usarIA) {
                         const resultado = await controller.consulta(payload);

                         // Emitir la respuesta solo a la sala de esa sesión
                         io.to(payload.sessionID).emit('chat:message', {
                              from: 'bot',
                              contenido: resultado.respuestaBOT,
                              ts: Date.now(),
                         });

                         // 🔹 Emitir actualización para el monitor de chats
                         io.emit('chat:actualizado', {
                              id_historial_conversacion: 0,
                              sesion: sessionID,
                              id_negocio: infoAsistente.id_negocio,
                              remitente: 'asistente',
                              mensaje: resultado.respuestaBOT,
                              fecha_mensaje: new Date(),
                         });

                         if (typeof ack === 'function') ack(resultado);
                    }
               } catch (error) {
                    console.error('Error en chat:consulta:', error);
                    if (typeof ack === 'function') {
                         ack({
                              type: 'error',
                              message: 'Ocurrio un error en el servidor al procesar tu consulta,por favor intentalo de nuevo mas tarde',
                         });
                    } else {
                         socket.emit(
                              'chat:error',
                              'No se pudo procesar la consulta'
                         );
                    }
               }
          });
          socket.on('chat:usarIA', ({ sessionID }) => {
               // Avisar a todos los clientes de la sala que hay un admin activo
               io.to(sessionID).emit('chat:usarIA', { activo: true });
          });

          socket.on('chat:dejarIA', ({ sessionID }) => {
               io.to(sessionID).emit('chat:usarIA', { activo: false });
          });

          // Cuando el admin envía un mensaje
          socket.on(
               'chat:mensajeAsistente',
               async ({ sessionID, mensaje, idNegocio }) => {
                    try {
                         // Reemitir el mensaje a la sala del cliente usando chat:message
                         io.to(sessionID).emit('chat:message', {
                              from: 'bot',
                              contenido: mensaje,
                              ts: Date.now(),
                         });
                         // Guardar mensaje en la base de datos como remitente 'admin'
                         await controller.registrarMensaje({
                              sesion: sessionID,
                              remitente: 'asistente',
                              mensaje: mensaje,
                              fecha_mensaje: new Date(),
                         });
                         // 🔹 Emitir actualización para el monitor de chats
                         io.emit('chat:actualizado', {
                              id_historial_conversacion: 0,
                              sesion: sessionID,
                              id_negocio: idNegocio,
                              remitente: 'asistente',
                              mensaje: mensaje,
                              fecha_mensaje: new Date(),
                         });
                    } catch (error) {
                         console.error(
                              'Error al enviar mensaje del asistente:',
                              error
                         );
                    }
               }
          );
     });
}
