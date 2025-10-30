import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 运行时简要配置可用性日志（不泄露密钥），方便在无头环境定位问题
const supabaseConfigPresence = {
  hasUrl: typeof url === 'string' && url.length > 10,
  hasAnon: typeof anon === 'string' && anon.length > 10,
  hasService: typeof service === 'string' && service.length > 10,
  env: process.env.NODE_ENV || 'development'
};
if (supabaseConfigPresence.env === 'production' && (!supabaseConfigPresence.hasUrl || !supabaseConfigPresence.hasService)) {
  console.error('Supabase config missing in production runtime:', supabaseConfigPresence);
}

// 轻量级兼容 Stub，用于在环境变量缺失时避免导入阶段崩溃
function createStub() {
  const makeSelectChain = () => ({
    eq: () => makeSelectChain(),
    order: () => makeSelectChain(),
    limit: () => Promise.resolve({ data: [], error: { code: 'CONFIG_MISSING', message: 'Supabase not configured' } }),
    single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found (stub)' } })
  });

  const makeInsertChain = () => ({
    select: () => ({
      single: () => Promise.resolve({ data: null, error: { code: 'CONFIG_MISSING', message: 'Supabase not configured' } })
    })
  });

  return {
    from: (_table: string) => ({
      select: (_cols?: string, _opts?: any) => makeSelectChain(),
      insert: (_payload: any) => makeInsertChain()
    }),
    rpc: (_fn: string, _args?: any) => Promise.resolve({ data: [], error: { code: 'CONFIG_MISSING', message: 'Supabase not configured' } }),
    auth: {
      getSession: () => Promise.resolve({ data: null, error: { code: 'CONFIG_MISSING', message: 'Supabase not configured' } })
    }
  } as any;
}

function createClientSafe(u?: string, k?: string, opts?: any) {
  const hasConfig = typeof u === 'string' && u.length > 10 && typeof k === 'string' && k.length > 10;
  if (!hasConfig) {
    const env = process.env.NODE_ENV || 'development';
    const meta = { env, hasUrl: typeof u === 'string' && u.length > 0, keyLen: typeof k === 'string' ? k.length : 0 };
    const msg = 'Supabase environment is missing; using safe stub client.';
    if (env === 'production') {
      console.error(msg, meta);
    } else {
      console.warn(msg, meta);
    }
    return createStub();
  }
  try {
    return createClient(u as string, k as string, opts);
  } catch (e) {
    console.error('Failed to initialize Supabase client, falling back to stub:', (e as any)?.message || e);
    return createStub();
  }
}

// 客户端实例（用于前端交互）
export const supabase = createClientSafe(url, anon);

// 服务端实例（用于后端操作，具有完整权限）
export const supabaseAdmin = createClientSafe(url, service, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;