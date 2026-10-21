import { Controller, Get, Query } from '@nestjs/common';
import { toPercent } from '../shared/http/percent';
import { InstrumentQuote } from './domain/instrumentQuote.valueObject';
import { SearchInstrumentsDto } from './dto/searchInstruments.dto';
import { InstrumentsService } from './instruments.service';

export interface InstrumentQuoteResponse {
  id: number;
  ticker: string;
  name: string;
  type: string;
  close: number | null;
  previousClose: number | null;
  dailyReturn: number | null; // percent
}

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

function toQuoteResponse(quote: InstrumentQuote): InstrumentQuoteResponse {
  return {
    id: quote.id,
    ticker: quote.ticker,
    name: quote.name,
    type: quote.type,
    close: quote.close,
    previousClose: quote.previousClose,
    dailyReturn: toPercent(quote.dailyReturn()),
  };
}
