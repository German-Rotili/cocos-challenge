import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateInstrumentDto,
  InstrumentResponse,
  toInstrumentResponse,
} from './dto/instrument.dto';
import {
  AddMarketDataDto,
  MarketDataResponse,
  toMarketDataResponse,
} from './dto/marketData.dto';
import { InstrumentsService } from './instruments.service';

/**
 * Writes reference data. Only registered when ENABLE_REFERENCE_DATA_ENDPOINTS=true
 * (see shared/config/referenceDataEndpoints.ts); otherwise these routes don't exist (404).
 */
@ApiTags('reference data')
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
