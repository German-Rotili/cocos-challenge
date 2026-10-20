import { Controller, Get, Query } from '@nestjs/common';
import { InstrumentQuote } from './domain/instrumentQuote.valueObject';
import { InstrumentsService } from './instruments.service';

export interface InstrumentQuoteResponse {
  id: number;
  ticker: string;
  name: string;
  type: string;
  close: number | null;
  previousClose: number | null;
  dailyReturn: number | null;
}

/** Public, read-only instrument endpoints. Writes live in ReferenceDataController. */
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instruments: InstrumentsService) {}

  @Get()
  async search(@Query('q') q?: string): Promise<InstrumentQuoteResponse[]> {
    const quotes = await this.instruments.search(q?.trim() || undefined);
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
    dailyReturn: quote.dailyReturn(),
  };
}
