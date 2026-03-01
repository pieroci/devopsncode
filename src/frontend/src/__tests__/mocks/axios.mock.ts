import { vi } from 'vitest';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Create a mock Axios instance
 */
export const createMockAxiosInstance = (): jest.Mocked<AxiosInstance> => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    head: vi.fn(),
    options: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
        clear: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
        clear: vi.fn(),
      },
    },
    defaults: {
      headers: {
        common: {},
        delete: {},
        get: {},
        head: {},
        post: {},
        put: {},
        patch: {},
      },
      baseURL: 'http://localhost:5000',
    },
  } as any;

  return instance;
};

/**
 * Create a mock Axios response
 */
export const createMockAxiosResponse = <T = any>(
  data: T,
  status = 200,
  statusText = 'OK'
): AxiosResponse<T> => ({
  data,
  status,
  statusText,
  headers: {},
  config: {} as AxiosRequestConfig,
});

/**
 * Create a mock Axios error
 */
export const createMockAxiosError = (
  message: string,
  status = 400,
  data?: any
) => {
  const error: any = new Error(message);
  error.response = {
    data,
    status,
    statusText: 'Bad Request',
    headers: {},
    config: {},
  };
  error.config = {};
  error.isAxiosError = true;
  return error;
};

// Mock axios module
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => createMockAxiosInstance()),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    isAxiosError: vi.fn((error: any) => error.isAxiosError === true),
  },
}));
