import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { OpenTodayQueryDto } from '@shared/dtos/dashboard/open-today-query.dto';
import { DashboardSummaryService } from '@shared/services/dashboard-summary.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('shared/dashboard')
export class DashboardSummaryController {
  constructor(private readonly dashboardSummaryService: DashboardSummaryService) {}

  @Get('today-summary')
  async todaySummary(@Query() query: OpenTodayQueryDto) {
    return this.dashboardSummaryService.getTodaySummary(query);
  }
}
