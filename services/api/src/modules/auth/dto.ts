import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class EmailSignupDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;

  // 선택: 닉네임이 있다면 사용 (없어도 됨)
  @IsOptional() @IsString() displayName?: string;

  // 서버에서 필수로 요구했던 항목들
  @IsDateString() dob: string; // ISO-8601 문자열
  @IsString() gender: string;  // 'male' | 'female' | 기타 문자열
}

export class EmailLoginDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}

export class AppleTokenDto {
  // 서비스에서 dto.token 을 읽는 경우를 대비해 token을 필수로.
  @IsString() token: string;

  // 필요 시 함께 전달될 수 있는 값들 (선택)
  @IsOptional() @IsString() idToken?: string;
  @IsOptional() @IsString() authorizationCode?: string;
}

export class PhoneRequestOtpDto {
  @IsString()
  phone: string;

  @IsString()
  countryCode: string;
}

export class PhoneVerifyDto {
  @IsString()
  requestId: string;

  @IsString()
  phone: string;

  @Matches(/^\d{4,8}$/)
  code: string;
}

export class CompletePhoneProfileDto {
  @IsString()
  phone: string;

  @IsString()
  verificationId: string;

  @IsString()
  nickname: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear: number;

  @IsIn(['female', 'male', 'other'])
  gender: 'female' | 'male' | 'other';

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUri?: string;
  
  @IsOptional()
  @IsBoolean()
  adminOverride?: boolean;
}
