import { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig extends AxiosRequestConfig {
    metadata?: {
      requestTime?: number;
    };
  }
}