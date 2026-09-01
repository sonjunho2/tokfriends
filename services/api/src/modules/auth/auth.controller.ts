// services/api/src/modules/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import {
  EmailSignupDto,
  EmailLoginDto,
  AppleTokenDto,
  PhoneRequestOtpDto,
  PhoneVerifyDto,
  CompletePhoneProfileDto,
} from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post(['signup/email', 'signup', 'register', 'users/signup', 'users/register'])
  @ApiOperation({
    summary: 'Sign up with email address',
    description: 'Accepts historical aliases used by early clients for backwards compatibility.',
  })
  signupEmailAliases(@Body() dto: EmailSignupDto) {
    return this.auth.signupEmail(dto);
  }

  @Public()
  @Post(['login/email', 'login'])
  @ApiOperation({
    summary: 'Log in with email address',
    description: 'Supports legacy email login endpoints to minimize breaking changes.',
  })
  loginEmailAliases(@Body() dto: EmailLoginDto) {
    return this.auth.loginEmail(dto);
  }

  @Public()
  @Post('apple')
  @ApiOperation({ summary: 'Authenticate with Apple Sign-In' })
  loginApple(@Body() dto: AppleTokenDto) {
    return this.auth.loginApple(dto);
  }

  @Public()
  @Post(['phone/request-otp', 'otp/request', 'otp/send', 'phone/otp/request'])
  @ApiOperation({
    summary: 'Request phone OTP',
    description: 'Also available under /auth/otp/request and /auth/otp/send for compatibility.',
  })
  requestPhoneOtp(@Body() dto: PhoneRequestOtpDto) {
    return this.auth.requestPhoneOtp(dto);
  }

  @Public()
  @Post(['phone/verify', 'otp/verify', 'otp/confirm', 'phone/otp/verify'])
  @ApiOperation({
    summary: 'Verify phone OTP',
    description: 'Legacy /auth/otp/verify and /auth/otp/confirm routes resolve here as aliases.',
  })
  verifyPhoneOtp(@Body() dto: PhoneVerifyDto) {
    return this.auth.verifyPhoneOtp(dto);
  }

  @Public()
  @Post(['phone/complete-profile', 'otp/complete-profile', 'phone/otp/complete-profile'])
  @ApiOperation({
    summary: 'Complete phone profile after OTP verification',
    description: 'Allows previously deployed clients to finish onboarding without code changes.',
  })
  completePhoneProfile(@Body() dto: CompletePhoneProfileDto) {
    return this.auth.completePhoneProfile(dto);
  }
}
