import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Message } from '@arco-design/web-react';
import { useAuthStore } from '@/store/auth';

type ApiResponse<T> = {
  code: number;
  data: T;
  message: string;
};

interface RequestInstance {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  interceptors: typeof request.interceptors;
  defaults: typeof request.defaults;
}

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const { code, data, message } = response.data;
    if (code === 0) {
      return data as unknown as AxiosResponse;
    }
    Message.error(message || '请求失败');
    return Promise.reject(new Error(message || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      Message.error('登录已过期，请重新登录');
    } else {
      Message.error(error.response?.data?.message || error.message || '网络异常');
    }
    return Promise.reject(error);
  },
);

export default request as unknown as RequestInstance;
