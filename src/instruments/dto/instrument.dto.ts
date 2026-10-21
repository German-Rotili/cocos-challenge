import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import type { Instrument as InstrumentEntity } from '../../database/entities/instrument.entity';
import { PageOf, PaginationQueryDto } from '../../shared/http/pagination.dto';
import { toPercent } from '../../shared/http/percent';
import type { InstrumentQuote } from '../domain/instrumentQuote.valueObject';

// ---------- Request ----------

export class CreateInstrumentDto {
  @IsString()
  @Length(1, 10)
  ticker!: string;

  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  @Length(1, 10)
  type!: string;
}

/** Both filters are optional, partial and case-insensitive; when both are sent, both must match. */
export class SearchInstrumentsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  ticker?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

// ---------- Response ----------

export class InstrumentResponse {
  id!: number;
  ticker!: string;
  name!: string;
  type!: string;
}

export class InstrumentQuoteResponse {
  id!: number;
  ticker!: string;
  name!: string;
  type!: string;

  @ApiProperty({ type: Number, nullable: true })
  close!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  previousClose!: number | null;

  @ApiProperty({ type: Number, nullable: true, description: 'Percent' })
  dailyReturn!: number | null;
}

export class InstrumentQuotePage extends PageOf(InstrumentQuoteResponse) {}

export function toInstrumentResponse(
  row: InstrumentEntity,
): InstrumentResponse {
  return { id: row.id, ticker: row.ticker, name: row.name, type: row.type };
}

export function toQuoteResponse(
  quote: InstrumentQuote,
): InstrumentQuoteResponse {
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
