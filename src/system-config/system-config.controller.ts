import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from "@nestjs/common"
import { AuthGuard } from "src/auth/guards/auth.guard"
import { SystemConfigService } from "./system-config.service"
import { CreateSystemConfigDto } from "./dto/create-system-config.dto"
import { UpdateSystemConfigDto } from "./dto/update-system-config.dto"

@UseGuards(AuthGuard)
@Controller("system-config")
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  async getAllConfigs() {
    return this.systemConfigService.getAllConfigs()
  }

  @Get(":key")
  async getConfigByKey(@Param("key") key: string) {
    return this.systemConfigService.getConfigByKey(key)
  }

  @Post()
  async createConfig(@Body() createSystemConfigDto: CreateSystemConfigDto) {
    return this.systemConfigService.createConfig(createSystemConfigDto)
  }

  @Patch(":key")
  async updateConfig(@Param("key") key: string, @Body() updateSystemConfigDto: UpdateSystemConfigDto) {
    return this.systemConfigService.updateConfig(key, updateSystemConfigDto)
  }

  @Delete(":key")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfig(@Param("key") key: string) {
    await this.systemConfigService.deleteConfig(key)
  }

  @Post("initialize-defaults")
  @HttpCode(HttpStatus.OK)
  async initializeDefaultConfigs() {
    await this.systemConfigService.initializeDefaultConfigs()
    return { message: "Default configurations initialized" }
  }

  @Get("value/:key")
  async getConfigValue(@Param("key") key: string) {
    const value = await this.systemConfigService.getConfigValue(key)
    return { key, value }
  }

  @Post("value/:key")
  async setConfigValue(@Param("key") key: string, @Body() body: { value: any; description?: string }) {
    return this.systemConfigService.setConfigValue(key, body.value, body.description)
  }
}
