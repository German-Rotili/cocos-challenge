import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database/database.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './shared/http/domainException.filter';
import { AccountsModule } from './accounts/accounts.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { ReferenceDataModule } from './instruments/referenceData.module';
import { referenceDataEndpointsEnabled } from './shared/config/referenceDataEndpoints';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
    useFactory: () => ({
        ...buildDataSourceOptions(process.env.DATABASE_URL),
        autoLoadEntities: true,
      }),
    }),
    InstrumentsModule,
    AccountsModule,
    ...(referenceDataEndpointsEnabled() ? [ReferenceDataModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
