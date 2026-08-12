export interface ApiResponse<T = any> {
  status: boolean;
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
