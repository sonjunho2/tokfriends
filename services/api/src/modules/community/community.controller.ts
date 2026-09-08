// services/api/src/modules/community/community.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

class ReportDto {
  @IsString()
  @IsOptional()
  targetUserId?: string;

  @IsString()
  @IsOptional()
  postId?: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

class BlockDto {
  @IsString()
  @IsNotEmpty()
  blockedUserId: string;
}

@ApiTags('community')
@Controller('community')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('report')
  async report(@Request() req: any, @Body() dto: ReportDto) {
    return this.communityService.report(req.user.id, dto);
  }

  @Post('block')
  async block(@Request() req: any, @Body() dto: BlockDto) {
    return this.communityService.block(req.user.id, dto);
  }

  @Get('blocks')
  async listBlocks(@Request() req: any) {
    return this.communityService.listBlocks(req.user.id);
  }

  @Delete('block/:blockedUserId')
  async unblock(
    @Request() req: any,
    @Param('blockedUserId') blockedUserId: string,
  ) {
    return this.communityService.unblock(req.user.id, blockedUserId);
  }
}
