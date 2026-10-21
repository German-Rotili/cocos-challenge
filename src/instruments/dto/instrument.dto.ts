import { IsOptional, IsString, Length } from 'class-validator';
import type { Instrument as InstrumentEntity } from '../../database/entities/instrument.entity';
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
export class SearchInstrumentsDto {
  @IsOptional()
  @IsString()
  ticker?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

// ---------- Response ----------

export interface InstrumentResponse {
  id: number;
  ticker: string;
  name: string;
  type: string;
}

export interface InstrumentQuoteResponse {
  id: number;
  ticker: string;
  name: string;
  type: string;
  close: number | null;
  previousClose: number | null;
  dailyReturn: number | null; // percent
}

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
