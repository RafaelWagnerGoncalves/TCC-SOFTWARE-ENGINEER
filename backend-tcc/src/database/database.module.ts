import { Module } from '@nestjs/common';
import { Pool } from 'pg';

const databaseProvider = {
  provide: 'PG_POOL',
  useFactory: () => {
    return new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'Manga',
      password: '123456',
      port: 5432
    });
  },
};

@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class DatabaseModule {}