import { config } from 'dotenv';

export const APP_ENVS = ['dev', 'test', 'prod'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

type Env = Record<string, string | undefined>;

const NODE_ENV_FOR: Record<AppEnv, string> = {
  dev: 'development',
  test: 'test',
  prod: 'production',
};

export function resolveAppEnv(env: Env = process.env): AppEnv {
  const value = env.APP_ENV;
  if (!value || !(APP_ENVS as readonly string[]).includes(value)) {
    throw new Error(
      `APP_ENV must be one of ${APP_ENVS.join(', ')}; got ${value ? `"${value}"` : 'nothing'}`,
    );
  }
  return value as AppEnv;
}

export function nodeEnvFor(appEnv: AppEnv): string {
  return NODE_ENV_FOR[appEnv];
}

export function loadEnvFiles({
  appEnv = resolveAppEnv(),
  override = false,
}: { appEnv?: AppEnv; override?: boolean } = {}): AppEnv {
  const base = `.env.${appEnv}`;
  const local = `.env.${appEnv}.local`;
  config({
    // with override the last file wins, so the order flips to keep .local on top
    path: override ? [base, local] : [local, base],
    override,
    quiet: true,
  });
  process.env.APP_ENV = appEnv;
  process.env.NODE_ENV ??= nodeEnvFor(appEnv);
  return appEnv;
}

export interface AppConfig {
  env: AppEnv;
  port: number;
  databaseUrl: string;
  databaseSsl: boolean;
}

/** Reads and validates everything the app needs, once, at startup. */
export function readConfig(env: Env = process.env): AppConfig {
  const appEnv = resolveAppEnv(env);

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl)
    throw new Error(
      `DATABASE_URL is not set (check .env.${appEnv} or .env.${appEnv}.local)`,
    );

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0)
    throw new Error(`PORT must be a positive integer; got "${env.PORT}"`);

  return {
    env: appEnv,
    port,
    databaseUrl,
    databaseSsl: env.DATABASE_SSL === 'true',
  };
}
