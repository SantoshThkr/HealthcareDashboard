export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: FieldErrors) {
    super(message);
  }

  static badRequest(message: string, errors?: FieldErrors): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }
}
