import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Traduce los errores HTTP a mensajes en castellano aptos para la interfaz.
 * Las vistas nunca ven códigos de estado ni cuerpos crudos de la API.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: HttpErrorResponse) => throwError(() => new Error(describe(error)))),
  );

function describe(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No hay conexión con el servidor. Comprueba tu red e inténtalo de nuevo.';
  }

  switch (error.status) {
    case 401:
    case 403:
      return 'Credenciales no válidas. Revisa las variables de entorno del proxy.';
    case 404:
      return 'El recurso solicitado ya no está disponible.';
    case 429:
      return 'Se ha superado el límite de peticiones. Espera unos segundos y reinténtalo.';
    default:
      return error.status >= 500
        ? 'El servicio no está disponible en este momento. Vuelve a intentarlo más tarde.'
        : 'No se ha podido completar la petición.';
  }
}
