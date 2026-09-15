import { Controller, Delete, Get, Param, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { InterestListQueryDto } from "./dto";
import { InterestsService } from "./interests.service";

type CurrentRequestUser = {
  id: string;
  activityAccountId?: string | null;
};

@Controller("interests")
@ApiTags("interests")
@ApiBearerAuth()
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Put(":targetAccountId")
  async send(
    @CurrentUser() user: CurrentRequestUser,
    @Param("targetAccountId") targetAccountId: string,
  ) {
    const data = await this.interestsService.send(
      user.id,
      user.activityAccountId,
      targetAccountId,
    );
    return { ok: true, data };
  }

  @Delete(":targetAccountId")
  async remove(
    @CurrentUser() user: CurrentRequestUser,
    @Param("targetAccountId") targetAccountId: string,
  ) {
    const data = await this.interestsService.remove(
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
    const data = await this.interestsService.getStatus(
      user.id,
      user.activityAccountId,
      targetAccountId,
    );
    return { ok: true, data };
  }

  @Get("sent")
  async sent(
    @CurrentUser() user: CurrentRequestUser,
    @Query() query: InterestListQueryDto,
  ) {
    const data = await this.interestsService.listSent(
      user.id,
      user.activityAccountId,
      query,
    );
    return { ok: true, data };
  }

  @Get("received")
  async received(
    @CurrentUser() user: CurrentRequestUser,
    @Query() query: InterestListQueryDto,
  ) {
    const data = await this.interestsService.listReceived(
      user.id,
      user.activityAccountId,
      query,
    );
    return { ok: true, data };
  }
}
