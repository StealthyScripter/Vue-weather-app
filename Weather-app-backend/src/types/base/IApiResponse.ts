// types/base/IApiResponse.ts
export interface IApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
  }