/** Backend ResultMessage envelope shared by manager/seller/buyer/im APIs. */
export interface ResultMessage<T = unknown> {
  success: boolean;
  message?: string;
  code?: number;
  result?: T;
  timestamp?: number;
}

export interface PageResult<T = unknown> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

export type ApiErrorLike = {
  isAxiosError?: boolean;
  message?: string;
  code?: string;
  response?: {
    status?: number;
    data?: ResultMessage;
  };
};
