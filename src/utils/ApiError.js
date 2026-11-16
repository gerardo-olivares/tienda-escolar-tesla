/* Error con código HTTP; el middleware de errores lo convierte en respuesta JSON */
class ApiError extends Error {
  constructor(status, mensaje, detalles = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }

  static badRequest(m = 'Solicitud inválida.', d = null) { return new ApiError(400, m, d); }
  static unauthorized(m = 'Debes iniciar sesión.') { return new ApiError(401, m); }
  static forbidden(m = 'No tienes permiso para realizar esta acción.') { return new ApiError(403, m); }
  static notFound(m = 'Recurso no encontrado.') { return new ApiError(404, m); }
  static conflict(m = 'El recurso ya existe.') { return new ApiError(409, m); }
}

module.exports = ApiError;
