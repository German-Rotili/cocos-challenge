import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Instrument as InstrumentEntity } from '../database/entities/instrument.entity';
import { MarketData as MarketDataEntity } from '../database/entities/marketData.entity';
import { AddMarketDataDto } from './dto/addMarketData.dto';
import { CreateInstrumentDto } from './dto/createInstrument.dto';
import { InstrumentsService } from './instruments.service';

export interface InstrumentResponse {
  id: number;
  ticker: string;
  name: string;
  type: string;
}

export interface MarketDataResponse {
  id: number;
  instrumentId: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  datetime: string;
}

/**
 * Writes reference data. Only registered when ENABLE_REFERENCE_DATA_ENDPOINTS=true
 * (see shared/config/referenceDataEndpoints.ts); otherwise these routes don't exist (404).
 */
@Controller('instruments')
export class ReferenceDataController {
  constructor(private readonly instruments: InstrumentsService) {}

  @Post()
  async create(@Body() dto: CreateInstrumentDto): Promise<InstrumentResponse> {
    return toInstrumentResponse(await this.instruments.create(dto));
  }

  @Post(':id/marketdata')
  async addMarketData(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMarketDataDto,
  ): Promise<MarketDataResponse> {
    return toMarketDataResponse(await this.instruments.addMarketData(id, dto));
  }
}

function toInstrumentResponse(row: InstrumentEntity): InstrumentResponse {
  return { id: row.id, ticker: row.ticker, name: row.name, type: row.type };
}

function toMarketDataResponse(row: MarketDataEntity): MarketDataResponse {
  return {
    id: row.id,
    instrumentId: row.instrumentId,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    previousClose: row.previousClose,
    datetime: row.datetime.toISOString(),
  };
}
