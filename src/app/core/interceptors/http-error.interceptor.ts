import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorNotificationService } from '../services/error-notification.service';

const HTTP_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos. Verifique as informações e tente novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  500: 'Erro interno no servidor. Tente novamente mais tarde.',
  503: 'Serviço indisponível. Tente novamente em instantes.',
};

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(ErrorNotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      // 401 é tratado pelo tokenRefreshInterceptor
      if (error.status === 401) {
        return throwError(() => error);
      }

      const apiMessage: string | undefined = error.error?.message;

      if (error.status === 400) {
        notification.show(apiMessage ?? HTTP_MESSAGES[400]);
        return throwError(() => error);
      }

      if (error.status === 403) {
        notification.show(apiMessage ?? HTTP_MESSAGES[403]);
        return throwError(() => error);
      }

      if (error.status === 404) {
        // Erros 404 em listas são tratados inline pelo componente; apenas notifica para GETs pontuais
        if (req.method === 'GET') {
          notification.show(apiMessage ?? HTTP_MESSAGES[404]);
        }
        return throwError(() => error);
      }

      if (error.status >= 500) {
        notification.show(HTTP_MESSAGES[error.status] ?? HTTP_MESSAGES[500]);
        return throwError(() => error);
      }

      return throwError(() => error);
    }),
  );
};
