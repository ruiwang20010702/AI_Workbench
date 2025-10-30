import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, CardContent } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('密码确认不匹配');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('密码长度至少为8位');
      setLoading(false);
      return;
    }

    // 验证密码复杂度
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;
    if (!passwordRegex.test(formData.password)) {
      setError('密码必须包含大小写字母、数字和特殊字符');
      setLoading(false);
      return;
    }

    try {
      await register(formData.username, formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.username && formData.email && formData.password && formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            注册 AI Workbench
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            已有账户？{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              立即登录
            </Link>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <Input
                label="用户名"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="请输入用户名"
                required
              />

              <Input
                label="邮箱地址"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="请输入邮箱地址"
                required
              />

              <Input
                label="密码"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码（至少8位）"
                helperText="密码长度至少为8位，包含大小写字母、数字和特殊字符"
                required
              />

              <Input
                label="确认密码"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="请再次输入密码"
                error={formData.confirmPassword && formData.password !== formData.confirmPassword ? '密码不匹配' : ''}
                required
              />

              <div className="flex items-center">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                  我同意{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                    服务条款
                  </Link>{' '}
                  和{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                    隐私政策
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={!isFormValid}
              >
                注册
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>
            注册后，您将能够使用所有功能，包括AI助手、笔记管理和待办事项。
          </p>
        </div>
      </div>
    </div>
  );
};