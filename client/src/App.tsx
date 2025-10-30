import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/layout';
import { HomePage } from './pages/HomePage';
import { LoginPage, RegisterPage } from './pages/auth';
import { useAuth } from './hooks/useAuth';
import { Loading } from './components/ui';
import { NotesPage, NoteEditorPage } from './pages/notes';
import { TodosPage, TodoEditorPage } from './pages/todos';
import { AIAssistantPage } from './pages/ai';
import { ProjectsPage } from './pages/ProjectsPage';
import { TestPage } from './pages/TestPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityPage } from './pages/ActivityPage';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 公共路由组件（未登录用户可访问）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
          {/* 公共路由 */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* 受保护的路由 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 笔记相关路由 */}
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Layout>
                  <NotesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <NoteEditorPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <NoteEditorPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 待办事项相关路由 */}
          <Route
            path="/todos"
            element={
              <ProtectedRoute>
                <Layout>
                  <TodosPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/todos/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <TodoEditorPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/todos/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TodoEditorPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/todos/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <TodoEditorPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* AI助手路由 */}
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <Layout>
                  <AIAssistantPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 项目管理路由 */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          

          {/* 全部活动页面 */}
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <Layout>
                  <ActivityPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 设置路由 */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <Layout>
                  <TestPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 404 页面 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">页面未找到</p>
                  <button
                    onClick={() => window.history.back()}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    返回上一页
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  </NotificationProvider>
  </AuthProvider>
  );
}

export default App;