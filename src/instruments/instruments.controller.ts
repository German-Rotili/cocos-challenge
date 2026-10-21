import { Controller, Get, Query } from '@nestjs/common';
import {
  InstrumentQuoteResponse,
  SearchInstrumentsDto,
  toQuoteResponse,
} from './dto/instrument.dto';
import { InstrumentsService } from './instruments.service';

/** Public, read-only instrument endpoints. Writes live in ReferenceDataController. */
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instruments: InstrumentsService) {}

  /** GET /instruments?ticker=…&name=… — blank filters are ignored. */
  @Get()
  async search(
    @Query() query: SearchInstrumentsDto,
  ): Promise<InstrumentQuoteResponse[]> {
    const quotes = await this.instruments.search({
      ticker: query.ticker?.trim() || undefined,
      name: query.name?.trim() || undefined,
    });
    return quotes.map(toQuoteResponse);
  }
}
