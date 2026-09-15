import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { ProfileVisitListQueryDto } from "./dto";
import { ProfileVisitsService } from "./profile-visits.service";

type CurrentRequestUser = {
  id: string;
  activityAccountId?: string | null;
};

@Controller("profile-visits")
@ApiTags("profile-visits")
@ApiBearerAuth()
export class ProfileVisitsController {
  constructor(private readonly profileVisitsService: ProfileVisitsService) {}

  @Post(":targetAccountId")
  async record(
    @CurrentUser() user: CurrentRequestUser,
    @Param("targetAccountId") targetAccountId: string,
  ) {
    const data = await this.profileVisitsService.record(
      user.id,
      user.activityAccountId,
      targetAccountId,
    );
    return { ok: true, data };
  }

  @Get("received")
  async received(
    @CurrentUser() user: CurrentRequestUser,
    @Query() query: ProfileVisitListQueryDto,
  ) {
    const data = await this.profileVisitsService.listReceived(
      user.id,
      user.activityAccountId,
      query,
    );
    return { ok: true, data };
  }

  @Get("sent")
  async sent(
    @CurrentUser() user: CurrentRequestUser,
    @Query() query: ProfileVisitListQueryDto,
  ) {
    const data = await this.profileVisitsService.listSent(
      user.id,
      user.activityAccountId,
      query,
    );
    return { ok: true, data };
  }
}
