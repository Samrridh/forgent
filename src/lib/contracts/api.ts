import { ErrorEnvelopeSchema } from "./schemas";

export interface ApiResponseSuccess<T> {
  status: "ok";
  data: T;
  timestamp: string;
}

export interface ApiResponseError {
  status: "error";
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export function createSuccessResponse<T>(data: T): ApiResponseSuccess<T> {
  return {
    status: "ok",
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(code: string, message: string, details?: unknown): ApiResponseError {
  const envelope = ErrorEnvelopeSchema.parse({
    status: "error",
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
  return envelope;
}
