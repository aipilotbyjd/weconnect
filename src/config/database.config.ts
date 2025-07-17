import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'weconnect',
    password: process.env.DB_PASSWORD || 'weconnect123',
    database: process.env.DB_DATABASE || 'weconnect',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [
      __dirname + '/../core/infrastructure/database/migrations/*{.ts,.js}',
    ],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    migrationsRun: false,
    autoLoadEntities: true,
  }),
);
