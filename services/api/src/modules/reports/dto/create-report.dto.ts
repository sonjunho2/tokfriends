import { IsOptional, IsString /*, IsEnum*/ } from 'class-validator';
// enum을 쓸 거면 위에 주석 풀고 enum import/정의 추가하세요.

export class CreateReportDto {
  // 기존 필드들(예: reason 등)이 이미 있을 겁니다.
  // 아래 2개만 추가하면 됩니다.

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString() // enum을 쓸 거면 IsEnum(ReportStatus)로 바꿔주세요.
  status?: string; // enum이면: status?: ReportStatus;
}
