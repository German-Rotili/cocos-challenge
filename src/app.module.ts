import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database/database.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(buildDataSourceOptions(process.env.DATABASE_URL)),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
