import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "src/prisma/prisma.service"
import { CreateAccountingEntryTemplateDto } from "./dto/create-accounting-entry-template.dto"
import { UpdateAccountingEntryTemplateDto } from "./dto/update-accounting-entry-template.dto"

@Injectable()
export class AccountingEntryTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string) {
    return this.prisma.accountingEntryTemplate.findMany({
      where: { companyId },
      orderBy: { templateNumber: "asc" },
      include: { lines: true },
    })
  }

  async create(companyId: string, dto: CreateAccountingEntryTemplateDto) {
    return this.prisma.accountingEntryTemplate.create({
      data: {
        companyId,
        templateNumber: dto.templateNumber,
        name: dto.name,
        filter: dto.filter,
        currency: dto.currency,
        transactionType: dto.transactionType,
        document: dto.document,
        condition: dto.condition,
        description: dto.description,
        isActive: dto.isActive ?? true,
        lines: {
          create: dto.lines.map((line, idx) => ({
            companyId,
            accountCode: line.accountCode,
            movementType: line.movementType,
            applicationType: line.applicationType,
            calculationBase: line.calculationBase,
            value: line.value,
            executionOrder: line.executionOrder ?? idx + 1,
          })),
        },
      } as any,
      include: { lines: true },
    })
  }

  async update(id: string, dto: UpdateAccountingEntryTemplateDto) {
    const exists = await this.prisma.accountingEntryTemplate.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException("Template not found")

    const data: any = {
      ...(dto.templateNumber !== undefined && { templateNumber: dto.templateNumber }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.filter !== undefined && { filter: dto.filter }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.transactionType !== undefined && { transactionType: dto.transactionType }),
      ...(dto.document !== undefined && { document: dto.document }),
      ...(dto.condition !== undefined && { condition: dto.condition }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    }

    let linesOp: any
    if (dto.lines && Array.isArray(dto.lines)) {
      linesOp = {
        deleteMany: { templateId: id },
        create: dto.lines.map((line, idx) => ({
          companyId: exists.companyId,
          accountCode: line.accountCode,
          movementType: line.movementType,
          applicationType: line.applicationType,
          calculationBase: line.calculationBase,
          value: line.value,
          executionOrder: line.executionOrder ?? idx + 1,
        })),
      }
    }

    return this.prisma.accountingEntryTemplate.update({
      where: { id },
      data: { ...data, ...(linesOp ? { lines: linesOp } : {}) } as any,
      include: { lines: true },
    })
  }

  async remove(id: string) {
    await this.prisma.accountingEntryTemplate.delete({ where: { id } })
    return { id, deleted: true }
  }

  async getById(id: string) {
    const t = await this.prisma.accountingEntryTemplate.findUnique({ where: { id }, include: { lines: true } })
    if (!t) throw new NotFoundException("Template not found")
    return t
  }
}

