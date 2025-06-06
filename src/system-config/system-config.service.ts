import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { SystemConfig } from "@prisma/client"

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  async getAllConfigs(): Promise<SystemConfig[]> {
    return this.prisma.systemConfig.findMany({
      orderBy: { key: "asc" },
    })
  }

  async getConfigByKey(key: string): Promise<SystemConfig | null> {
    return this.prisma.systemConfig.findUnique({
      where: { key },
    })
  }

  async createConfig(configDto: any): Promise<SystemConfig> {
    return this.prisma.systemConfig.create({
      data: configDto,
    })
  }

  async updateConfig(key: string, updates: any): Promise<SystemConfig> {
    const existingConfig = await this.prisma.systemConfig.findUnique({
      where: { key },
    })

    if (!existingConfig) {
      throw new NotFoundException(`System config with key ${key} not found`)
    }

    return this.prisma.systemConfig.update({
      where: { key },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    })
  }

  async deleteConfig(key: string): Promise<void> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    })

    if (!config) {
      throw new NotFoundException(`System config with key ${key} not found`)
    }

    await this.prisma.systemConfig.delete({
      where: { key },
    })
  }

  // Helper methods for common configurations
  async getConfigValue<T>(key: string, defaultValue?: T): Promise<T> {
    const config = await this.getConfigByKey(key)
    return config ? (config.value as T) : defaultValue
  }

  async setConfigValue(key: string, value: any, description?: string): Promise<SystemConfig> {
    const existingConfig = await this.getConfigByKey(key)

    if (existingConfig) {
      return this.updateConfig(key, { value, description })
    } else {
      return this.createConfig({ key, value, description })
    }
  }

  // Predefined system configurations
  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = [
      {
        key: "conciliation.auto_match_tolerance",
        value: { amount: 0.01, percentage: 0.001 },
        description: "Tolerancia para conciliación automática",
      },
      {
        key: "documents.auto_classification",
        value: { enabled: true, confidence_threshold: 0.8 },
        description: "Configuración para clasificación automática de documentos",
      },
      {
        key: "transactions.import_rules",
        value: {
          itf_keywords: ["itf", "impuesto"],
          detraction_keywords: ["detraccion", "detracc"],
          fee_keywords: ["comision", "mantenimiento"],
        },
        description: "Reglas para clasificación automática de transacciones",
      },
      {
        key: "system.maintenance_mode",
        value: { enabled: false, message: "Sistema en mantenimiento" },
        description: "Modo de mantenimiento del sistema",
      },
    ]

    for (const config of defaultConfigs) {
      const existing = await this.getConfigByKey(config.key)
      if (!existing) {
        await this.createConfig(config)
      }
    }
  }
}
