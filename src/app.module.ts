import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database/database.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './shared/http/domainException.filter';

@Module({
  imports: [
    TypeOrmModule.forRoot(buildDataSourceOptions(process.env.DATABASE_URL)),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
