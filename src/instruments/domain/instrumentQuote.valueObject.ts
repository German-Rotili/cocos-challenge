import { Money } from '../../shared/domain/money.valueObject';

export interface InstrumentQuoteProps {
  id: number;
  ticker: string;
  name: string;
  type: string;
  close: number | null;
  previousClose: number | null;
  asOf: Date | null;
}

export class InstrumentQuote {
  readonly id: number;
  readonly ticker: string;
  readonly name: string;
  readonly type: string;
  readonly close: number | null;
  readonly previousClose: number | null;
  readonly asOf: Date | null;

  private constructor(props: InstrumentQuoteProps) {
    this.id = props.id;
    this.ticker = props.ticker;
    this.name = props.name;
    this.type = props.type;
    this.close = props.close;
    this.previousClose = props.previousClose;
    this.asOf = props.asOf;
    Object.freeze(this);
  }

  static create(props: InstrumentQuoteProps): InstrumentQuote {
    if (props.close != null && props.close < 0) {
      throw new Error(`Negative close for ${props.ticker}`);
    }
    return new InstrumentQuote(props);
  }

  get isCash(): boolean {
    return this.type === 'MONEDA';
  }

  lastPrice(): Money | null {
    if (this.isCash) return Money.of(1);
    return this.close == null ? null : Money.of(this.close);
  }

  dailyReturn(): number | null {
    if (this.close == null || !this.previousClose) return null;
    return (this.close - this.previousClose) / this.previousClose;
  }

  marketValue(shares: number): Money | null {
    return this.lastPrice()?.times(shares) ?? null;
  }
}
