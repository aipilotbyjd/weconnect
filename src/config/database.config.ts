import { registerAs } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export default registerAs(
  'database',
  (): MongooseModuleOptions => ({
    uri: `mongodb://${process.env.DB_USERNAME || 'weconnect'}:${process.env.DB_PASSWORD || 'weconnect123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '27017'}/${process.env.DB_DATABASE || 'weconnect'}?authSource=admin`,
  }),
);
