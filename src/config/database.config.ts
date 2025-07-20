import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mongodb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '27017', 10),
    username: process.env.DB_USERNAME || 'weconnect',
    password: process.env.DB_PASSWORD || 'weconnect123',
    database: process.env.DB_DATABASE || 'weconnect',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }),
);
