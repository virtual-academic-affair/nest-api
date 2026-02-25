import { Controller, Get, Query } from '@nestjs/common';
import { QueryDto } from '@shared/dtos/dynamic-data/query.dto';
import { DynamicDataService } from '@shared/services/dynamic-data.service';

@Controller('shared/dynamic-data')
export class DynamicDataController {
  constructor(private readonly dynamicDataService: DynamicDataService) {}

  @Get()
  async getDynamicData(@Query() query: QueryDto) {
    const result: Record<string, any> = {};

    if (query.settings && query.settings.length > 0) {
      result.settings = await this.dynamicDataService.getSettings(query.settings);
    }

    if (query.enums && query.enums.length > 0) {
      result.enums = await this.dynamicDataService.getEnums(query.enums);
    }

    return result;
  }
}
