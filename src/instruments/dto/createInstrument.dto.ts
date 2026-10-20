import { IsString, Length } from 'class-validator';

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
