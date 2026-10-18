export interface Paginated<T> {
  items: T[];
  total: number;
  page?: number;
  page_size?: number;
}

export interface ApiError {
  detail: string;
}
