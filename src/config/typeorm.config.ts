import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'weconnect',
  password: process.env.DB_PASSWORD || 'weconnect123',
  database: process.env.DB_DATABASE || 'weconnect',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'core', 'infrastructure', 'database', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: true,
});
