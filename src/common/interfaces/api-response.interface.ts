export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}
