import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserModel } from '../models/User';

export const authenticateToken: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // 个人工作台模式：跳过认证，使用默认用户
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token) {
      // 如果提供了token，尝试验证
      try {
        const decoded = verifyToken(token);
        const user = await UserModel.findById(decoded.userId);
        
        if (user) {
          const { password_hash, ...userWithoutPassword } = user;
          req.user = userWithoutPassword;
          next();
          return;
        }
      } catch (error) {
        // Token验证失败，继续使用默认用户
      }
    }

    // 没有token或token无效时，创建或使用默认用户
    let defaultUser = await UserModel.findByEmail('admin@localhost');
    
    if (!defaultUser) {
      // 创建默认管理员用户
      const { hashPassword } = await import('../utils/password');
      const hashedPassword = await hashPassword('admin123');
      
      defaultUser = await UserModel.create({
        email: 'admin@localhost',
        password_hash: hashedPassword,
        display_name: '管理员'
      });
    }

    // 从用户对象中移除密码哈希
    const { password_hash, ...userWithoutPassword } = defaultUser;
    req.user = userWithoutPassword;

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

export const optionalAuth: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await UserModel.findById(decoded.userId);

      if (user) {
        const { password_hash, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时继续执行，不返回错误
    next();
  }
};