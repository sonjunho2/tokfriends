import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';

import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QuickLoginDto {
  @IsString()
  @IsNotEmpty()
  nickname: string;
}

export class EmailLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class TestLoginDto {
  @IsOptional()
  @IsString()
  role?: 'USER' | 'CREATOR' | 'ADMIN';
}

export class SocialLoginDto {
  @IsOptional()
  @IsString()
  provider?: 'kakao' | 'naver' | 'google' | 'apple';

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  socialId?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post(['login', 'quick-login'])
  @ApiOperation({ summary: '닉네임 기반 빠른 로그인 또는 등록' })
  async quickLogin(@Body() dto: QuickLoginDto) {
    const data = await this.auth.quickLoginOrRegister(dto.nickname);
    return { ok: true, data };
  }

  @Public()
  @Post('login/email')
  @ApiOperation({ summary: '관리자 및 이메일/비밀번호 로그인' })
  async emailLogin(@Body() dto: EmailLoginDto) {
    const data = await this.auth.loginWithEmail(dto.email, dto.password);
    return data;
  }

  @Public()
  @Post('test-login')
  @ApiOperation({ summary: '테스트 및 시연용 계정 로그인' })
  async testLogin(@Body() dto?: TestLoginDto) {
    const data = await this.auth.testLogin(dto?.role);
    return { ok: true, data };
  }

  @Public()
  @Post(['oauth', 'social'])
  @ApiOperation({ summary: '통합 소셜 OAuth 로그인 (카카오, 네이버, 구글, 애플)' })
  async unifiedSocialLogin(@Body() dto: SocialLoginDto) {
    const provider = dto.provider || 'kakao';
    const data = await this.auth.socialLogin(provider, dto);
    return { ok: true, data, token: data.token, accessToken: data.accessToken, user: data.user };
  }

  @Public()
  @Post('kakao')
  @ApiOperation({ summary: '카카오 OAuth 로그인 (모바일/웹 공용)' })
  async kakaoLogin(@Body() dto: SocialLoginDto) {
    const data = await this.auth.socialLogin('kakao', dto);
    return { ok: true, data, token: data.token, accessToken: data.accessToken, user: data.user };
  }

  @Public()
  @Post('naver')
  @ApiOperation({ summary: '네이버 OAuth 로그인 (모바일/웹 공용)' })
  async naverLogin(@Body() dto: SocialLoginDto) {
    const data = await this.auth.socialLogin('naver', dto);
    return { ok: true, data, token: data.token, accessToken: data.accessToken, user: data.user };
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: '구글 OAuth 로그인 (모바일/웹 공용)' })
  async googleLogin(@Body() dto: SocialLoginDto) {
    const data = await this.auth.socialLogin('google', dto);
    return { ok: true, data, token: data.token, accessToken: data.accessToken, user: data.user };
  }

  @Public()
  @Post('apple')
  @ApiOperation({ summary: '애플 OAuth 로그인 (모바일/웹 공용)' })
  async appleLogin(@Body() dto: SocialLoginDto) {
    const data = await this.auth.socialLogin('apple', dto);
    return { ok: true, data, token: data.token, accessToken: data.accessToken, user: data.user };
  }
}
