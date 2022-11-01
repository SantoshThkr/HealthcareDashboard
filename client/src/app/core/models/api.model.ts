export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}

export type LoadState = 'loading' | 'loaded' | 'empty' | 'error';
