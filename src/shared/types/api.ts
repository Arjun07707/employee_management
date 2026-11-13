export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  message?: string;
  data: T[];
  pagination: Pagination;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}
