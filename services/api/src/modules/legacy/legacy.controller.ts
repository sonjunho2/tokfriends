// 새 파일: services/api/src/modules/legacy/legacy.controller.ts
import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('legacy')
@Controller()
export class LegacyController {
  @Post('*')
  @HttpCode(HttpStatus.GONE)
  @ApiOperation({
    summary: 'Legacy sequential POST fallback',
    description:
      'Temporary catch-all for mobile clients still probing multiple POST endpoints. Replace with concrete handling once canonical path is finalized.',
  })
  @ApiParam({
    name: 'fallbackPath',
    required: true,
    description: 'Captured path segment from the wildcard route.',
  })
  @ApiResponse({
    status: HttpStatus.GONE,
    description: 'Signals that the probed legacy path should no longer be used.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_IMPLEMENTED,
    description: 'Placeholder while migration logic is TODO.',
  })
  handleLegacyPost(@Req() req: Request) {
    // TODO: replace with actual bridging logic for sequential POST attempts.
    return {
      message: 'Legacy POST path is deprecated. Use the documented canonical endpoint.',
      requestedPath: req.path,
    };
  }
}
