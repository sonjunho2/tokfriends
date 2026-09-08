import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DiscoverService } from './discover.service';

@ApiTags('discover')
@ApiBearerAuth()
@Controller('discover')
export class DiscoverController {
  constructor(private readonly discover: DiscoverService) {}

  @Get()
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'ageMin', required: false, type: Number })
  @ApiQuery({ name: 'ageMax', required: false, type: Number })
  @ApiQuery({ name: 'region', required: false, type: String })
  async list(
    @Request() req: any,
    @Query('gender') gender?: string,
    @Query('ageMin') ageMin?: string,
    @Query('ageMax') ageMax?: string,
    @Query('region') region?: string,
  ) {
    const currentUserId = req.user?.sub ?? req.user?.id;

    return {
      ok: true,
      data: await this.discover.findUsers({
        gender,
        ageMin: ageMin ? Number(ageMin) : undefined,
        ageMax: ageMax ? Number(ageMax) : undefined,
        region,
      }, currentUserId),
    };
  }
}
