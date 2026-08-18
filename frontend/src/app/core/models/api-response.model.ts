/**
 * Standard backend envelopes. Every successful response is { success, data };
 * errors are { success:false, message } and validation errors add `errors[]`.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}
