import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MANAGER_ROLES } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('store')
  getStore() {
    return this.settingsService.getStore();
  }

  @Put('store')
  @Roles(...MANAGER_ROLES)
  updateStore(
    @Body() dto: UpdateStoreSettingsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.settingsService.updateStore(dto, user);
  }
}
