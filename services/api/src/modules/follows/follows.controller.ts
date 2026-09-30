import { Controller, Delete, Get, Param, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { FollowListQueryDto } from "./dto";
import { FollowsService } from "./follows.service";

type CurrentRequestUser = {
  id: string;
  activityAccountId?: string | null;
};

@Controller("follows")
@ApiTags("follows")
@ApiBearerAuth()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Put(":targetAccountId")
  async follow(
    @CurrentUser() user: CurrentRequestUser,
    @Param("targetAccountId") targetAccountId: string,
  ) {
    const data = await this.followsService.follow(
      user.id,
      user.activityAccountId,
      targetAccountId,
    );
    return { ok: true, data };
  }

  @Delete(":targetAccountId")
  async unfollow(
    @CurrentUser() user: CurrentRequestUser,
    @Param("targetAccountId") targetAccountId: string,
  ) {
    const data = await this.followsService.unfollow(
      user.activityAccountId,
      targetAccountId,
    );
    return { ok: true, data };
  }

  @Get(":targetAccountId/status")
  async status(
    @CurrentUser() user: CurrentRequestUser,
    @Param("targetAccountId") targetAccountId: string,
  ) {
    const data = await this.followsService.getStatus(
      user.id,
      user.activityAccountId,
      targetAccountId,
    );
    return { ok: true, data };
  }

  @Get(":accountId/followers")
  async followers(
    @CurrentUser() user: CurrentRequestUser,
    @Param("accountId") accountId: string,
    @Query() query: FollowListQueryDto,
  ) {
    const data = await this.followsService.listFollowers(
      user.id,
      user.activityAccountId,
      accountId,
      query,
    );
    return { ok: true, data };
  }

  @Get(":accountId/following")
  async following(
    @CurrentUser() user: CurrentRequestUser,
    @Param("accountId") accountId: string,
    @Query() query: FollowListQueryDto,
  ) {
    const data = await this.followsService.listFollowing(
      user.id,
      user.activityAccountId,
      accountId,
      query,
    );
    return { ok: true, data };
  }
}
