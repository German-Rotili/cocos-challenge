import { config } from 'dotenv';
import { resolveAppEnv, nodeEnvFor } from './environment';

const appEnv = resolveAppEnv();

config({ path: `.env.${appEnv}`, quiet: true });

process.env.NODE_ENV ??= nodeEnvFor(appEnv);