import { DataSourceOptions } from 'typeorm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import appConfig from './app.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const databaseConfig = (): DataSourceOptions => {
  const config = appConfig();
  
  return {
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    synchronize: config.database.synchronize,
    logging: config.database.logging,
    entities: [join(__dirname, '../../modules/**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../../migrations/*{.ts,.js}')],
    subscribers: [],
    extra: {
      // PostGIS support
      extensions: ['postgis'],
    },
  };
};