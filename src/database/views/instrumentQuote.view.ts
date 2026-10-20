import { DataSource, ViewColumn, ViewEntity } from 'typeorm';
import { Instrument as InstrumentEntity } from '../entities/instrument.entity';
import { MarketData as MarketDataEntity } from '../entities/marketData.entity';
import { decimalTransformer } from '../../shared/persistence/transformers';

@ViewEntity({
  name: 'instrument_quotes',
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('i.id', 'id')
      .addSelect('i.ticker', 'ticker')
      .addSelect('i.name', 'name')
      .addSelect('i.type', 'type')
      .addSelect('m.close', 'close')
      .addSelect('m.previousClose', 'previousClose')
      .addSelect('m.datetime', 'asOf')
      .from(InstrumentEntity, 'i')
      .leftJoin(MarketDataEntity, 'm', 'm.instrumentId = i.id')
      .distinctOn(['i.id'])
      .orderBy('i.id')
      .addOrderBy('m.datetime', 'DESC')
      .addOrderBy('m.id', 'DESC'),
})
export class InstrumentQuoteView {
  @ViewColumn()
  id!: number;

  @ViewColumn()
  ticker!: string;

  @ViewColumn()
  name!: string;

  @ViewColumn()
  type!: string;

  @ViewColumn({ transformer: decimalTransformer })
  close!: number | null;

  @ViewColumn({ transformer: decimalTransformer })
  previousClose!: number | null;

  @ViewColumn()
  asOf!: Date | null;
}