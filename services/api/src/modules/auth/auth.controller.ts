import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';

export class QuickLoginDto {
  nickname: string;
}

export class EmailLoginDto {
  email: string;
  password: string;
}

export class TestLoginDto {
  role?: 'USER' | 'CREATOR' | 'ADMIN';
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
}
