import { IsString, IsJWT } from 'class-validator';

export class RefreshDto {
  @IsString()
  @IsJWT()
  refreshToken!: string;
}
