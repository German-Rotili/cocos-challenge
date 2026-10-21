import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { mapPage } from '../shared/http/pagination.dto';
import {
  InstrumentQuotePage,
  SearchInstrumentsDto,
  toQuoteResponse,
} from './dto/instrument.dto';
import { InstrumentsService } from './instruments.service';

/** Public, read-only instrument endpoints. Writes live in ReferenceDataController. */
@ApiTags('instruments')
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instruments: InstrumentsService) {}

  /** GET /instruments?ticker=…&name=…&limit=…&offset=… — blank filters are ignored. */
  @Get()
  async search(
    @Query() query: SearchInstrumentsDto,
  ): Promise<InstrumentQuotePage> {
    const page = await this.instruments.search(
      {
        ticker: query.ticker?.trim() || undefined,
        name: query.name?.trim() || undefined,
      },
      query,
    );
    return mapPage(page, toQuoteResponse);
  }
}
