import { IsOptional, IsString } from 'class-validator';

export class SearchInstrumentsDto {
  @IsOptional()
  @IsString()
  ticker?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
