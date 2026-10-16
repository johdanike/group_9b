import {
  IsDefined,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PushKeysDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]{22}={0,2}$/) auth: string;
  @IsString() @Matches(/^[A-Za-z0-9_-]{87}={0,2}$/) p256dh: string;
}
export class PushEndpointDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint: string;
}
export class SavePushDeviceDto extends PushEndpointDto {
  @IsDefined() @ValidateNested() @Type(() => PushKeysDto) keys: PushKeysDto;
}
