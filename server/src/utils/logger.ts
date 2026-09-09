type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const SENSITIVE_KEYS = [
    'password', 'token', 'secret', 'access_token', 'refresh_token',
    'authorization', 'encryption_key', 'api_key', 'auth_tag', 'private_app_token'
  ];

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk));
    if (isSensitive) {
      sanitized[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = sanitize(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const metaClean = meta ? sanitize(meta) : undefined;
  const entry = {
    timestamp,
    level,
    message,
    ...(metaClean ? { meta: metaClean } : {})
  };

  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (message: string, meta?: any) => log('info', message, meta),
  warn: (message: string, meta?: any) => log('warn', message, meta),
  error: (message: string, meta?: any) => log('error', message, meta),
  debug: (message: string, meta?: any) => log('debug', message, meta),
};
