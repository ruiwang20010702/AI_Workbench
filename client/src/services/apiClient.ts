import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API请求错误:', error);
    
    if (error.response?.status === 401) {
      const url = (error.config?.url ?? '') as string;
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      // 登录/注册失败不应清除状态或强制跳转，交由页面自行处理
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // 详细的错误信息处理
    let message = '请求失败';
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      message = '网络连接失败，请检查网络连接或服务器状态';
    } else if (error.code === 'ECONNREFUSED') {
      message = '无法连接到服务器，请确认服务器是否正在运行';
    } else if (error.response) {
      // 服务器响应了错误状态码
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          message = data?.message || '请求参数错误';
          break;
        case 401:
          message = data?.message || '未授权访问';
          break;
        case 403:
          message = data?.message || '访问被拒绝';
          break;
        case 404:
          message = data?.message || '请求的资源不存在';
          break;
        case 500:
          message = data?.message || '服务器内部错误';
          break;
        default:
          message = data?.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      message = '服务器无响应，请检查网络连接';
    } else {
      // 其他错误
      message = error.message || '未知错误';
    }
    
    return Promise.reject(new Error(message));
  }
);