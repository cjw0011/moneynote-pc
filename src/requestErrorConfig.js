import { message } from 'antd';
import qs from 'qs';
import { request as umiRequest } from '@umijs/max';

let refreshPromise = null;

const parseJwt = (token) => {
  try {
    const base64 = token.split('.')[1];
    const json = typeof window === 'undefined'
      ? Buffer.from(base64, 'base64').toString('utf8')
      : atob(base64);
    return JSON.parse(json);
  } catch {
    return {};
  }
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('no refresh token');
    }
    refreshPromise = umiRequest('refresh', {
      method: 'POST',
      data: { refreshToken },
      skipErrorHandler: true,
    })
      .then((res) => {
        localStorage.setItem('accessToken', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
        return res.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig = {
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': localStorage.getItem("umi_locale") ?? 'zh-CN',
  },
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  requestInterceptors: [
    async (config) => {
      if ((config.url || '').includes('refresh')) {
        return config;
      }
      let token = localStorage.getItem('accessToken');
      if (token) {
        const { exp } = parseJwt(token);
        if (exp && exp * 1000 - Date.now() < 60 * 1000) {
          try {
            token = await refreshAccessToken();
          } catch (e) {
            localStorage.removeItem('accessToken');
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            sessionStorage.removeItem('refreshToken');
            window.location.href = '/user/login';
          }
        }
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
  ],
  errorConfig: {
    // 错误接收及处理
    errorHandler: async (error, opts) => {
      if (opts?.skipErrorHandler) throw error;
      if (error?.response?.status === 401 && window.location.pathname !== '/user/login') {
        try {
          const token = await refreshAccessToken();
          const config = error.config || {};
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          const url = (config.url || '').replace(config.baseURL || '', '');
          return umiRequest(url, { ...config, skipErrorHandler: true });
        } catch (e) {
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('accessToken');
          sessionStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('refreshToken');
          window.location.href = '/user/login';
          return;
        }
      }
      console.log(error);
      // if (error.response.data?.message) {
      //   message.error(error.response.data?.message)
      // }
    },
  },

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      // 拦截响应数据，进行个性化处理
      const { data, config } = response;
      if (config.skipErrorHandler) return response;
      if (data.showType === 4) {
        message.success(data.message);
      }
      if (data.showType === 2) {
        message.error(data.message);
        return Promise.reject(data)
      }
      return response;
    },
  ],
};
