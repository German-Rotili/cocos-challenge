import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument as InstrumentEntity } from '../database/entities/instrument.entity';
import { InstrumentQuoteView } from '../database/views/instrumentQuote.view';
import { MarketData as MarketDataEntity } from '../database/entities/marketData.entity';
import { InstrumentsController } from './instruments.controller';
import { InstrumentsService } from './instruments.service';

@Module({
  imports: [TypeOrmModule.forFeature([InstrumentEntity, MarketDataEntity, InstrumentQuoteView])],
  controllers: [InstrumentsController],
  providers: [InstrumentsService],
  exports: [InstrumentsService],
})
export class InstrumentsModule {}
