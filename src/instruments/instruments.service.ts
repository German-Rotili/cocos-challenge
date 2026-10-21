import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, ILike, In } from 'typeorm';
import { Instrument as InstrumentEntity } from '../database/entities/instrument.entity';
import { InstrumentQuoteView } from '../database/views/instrumentQuote.view';
import { MarketData as MarketDataEntity } from '../database/entities/marketData.entity';
import { InstrumentNotFoundError } from './domain/errors';
import { InstrumentQuote } from './domain/instrumentQuote.valueObject';
import { AddMarketDataDto } from './dto/addMarketData.dto';
import { CreateInstrumentDto } from './dto/createInstrument.dto';

const SEARCH_LIMIT = 50;

@Injectable()
export class InstrumentsService {
  constructor(private readonly dataSource: DataSource) {}

  create(dto: CreateInstrumentDto): Promise<InstrumentEntity> {
    const repository = this.dataSource.getRepository(InstrumentEntity);
    return repository.save(repository.create(dto));
  }

  async addMarketData(
    instrumentId: number,
    dto: AddMarketDataDto,
  ): Promise<MarketDataEntity> {
    const exists = await this.dataSource
      .getRepository(InstrumentEntity)
      .existsBy({ id: instrumentId });
    if (!exists)
      throw new InstrumentNotFoundError(`Instrument ${instrumentId} not found`);

    const repository = this.dataSource.getRepository(MarketDataEntity);
    return repository.save(
      repository.create({
        instrumentId,
        close: dto.close,
        previousClose: dto.previousClose,
        open: dto.open ?? dto.close,
        high: dto.high ?? dto.close,
        low: dto.low ?? dto.close,
        datetime: new Date(),
      }),
    );
  }

  async search(query?: string): Promise<InstrumentQuote[]> {
    const pattern = query ? `%${escapeLike(query)}%` : undefined;
    const rows = await this.dataSource.getRepository(InstrumentQuoteView).find({
      where: pattern
        ? [{ ticker: ILike(pattern) }, { name: ILike(pattern) }]
        : {},
      order: { ticker: 'ASC' },
      take: SEARCH_LIMIT,
    });
    return rows.map(toQuote);
  }

  async findQuote(
    id: number,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<InstrumentQuote> {
    const row = await manager.findOneBy(InstrumentQuoteView, { id });
    if (!row) throw new InstrumentNotFoundError(`Instrument ${id} not found`);
    return toQuote(row);
  }

  async findQuotes(
    ids: number[],
    manager: EntityManager = this.dataSource.manager,
  ): Promise<Map<number, InstrumentQuote>> {
    if (ids.length === 0) return new Map();
    const rows = await manager.findBy(InstrumentQuoteView, { id: In(ids) });
    return new Map(rows.map((row) => [row.id, toQuote(row)]));
  }
}

function toQuote(row: InstrumentQuoteView): InstrumentQuote {
  return InstrumentQuote.create({
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    type: row.type,
    close: row.close,
    previousClose: row.previousClose,
    asOf: row.asOf,
  });
}

/** Makes % and _ in user input match literally instead of acting as wildcards. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
