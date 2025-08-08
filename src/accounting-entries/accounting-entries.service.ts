import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma, MovementType } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { CreateAccountingEntryDto } from "./dto/create-accounting-entry.dto"
import { UpdateAccountingEntryDto } from "./dto/update-accounting-entry.dto"
import { PaginatedResponse, PaginationDto } from "../common/dto/pagination.dto"

@Injectable()
export class AccountingEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchEntries(companyId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination
    const skip = (page - 1) * limit

    const where: Prisma.AccountingEntryWhereInput = { companyId }

    const [data, total] = await Promise.all([
      this.prisma.accountingEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lines: true,
          conciliation: { select: { id: true, reference: true } },
        },
      }),
      this.prisma.accountingEntry.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) } satisfies PaginatedResponse<any>
  }

  async createEntry(dto: CreateAccountingEntryDto) {
    // Validate lines
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException("Entry must contain at least one line")
    }

    return this.prisma.accountingEntry.create({
      data: {
        companyId: dto.companyId,
        conciliationId: dto.conciliationId,
        status: dto.status ?? "DRAFT",
        notes: dto.notes,
        metadata: (dto as any).metadata ?? undefined,
        lines: {
          create: dto.lines.map((l, idx) => ({
            companyId: dto.companyId,
            lineNumber: l.lineNumber ?? idx + 1,
            accountCode: l.accountCode,
            movementType: l.movementType,
            amount: new Prisma.Decimal(l.amount),
            description: l.description,
            auxiliaryCode: l.auxiliaryCode,
            documentRef: l.documentRef,
          })),
        },
      } as any,
      include: { lines: true },
    })
  }

  async getById(id: string) {
    const entry = await this.prisma.accountingEntry.findUnique({
      where: { id },
      include: { lines: true },
    })
    if (!entry) throw new NotFoundException("Accounting entry not found")
    return entry
  }

  async updateEntry(id: string, dto: UpdateAccountingEntryDto) {
    const existing = await this.prisma.accountingEntry.findUnique({ where: { id }, include: { lines: true } })
    if (!existing) throw new NotFoundException("Accounting entry not found")

    // Lines replacement if provided
    let linesOp: Prisma.AccountingEntryLineUncheckedUpdateManyWithoutEntryNestedInput | undefined

    if (dto.lines) {
      // Simplest approach: replace all lines
      linesOp = {
        deleteMany: { entryId: id },
        create: dto.lines.map((l, idx) => ({
          companyId: existing.companyId,
          lineNumber: l.lineNumber ?? idx + 1,
          accountCode: l.accountCode,
          movementType: l.movementType,
          amount: new Prisma.Decimal(l.amount),
          description: l.description,
          auxiliaryCode: l.auxiliaryCode,
          documentRef: l.documentRef,
        })),
      }
    }

    return this.prisma.accountingEntry.update({
      where: { id },
      data: {
        conciliationId: dto.conciliationId ?? existing.conciliationId,
        status: dto.status ?? existing.status,
        notes: dto.notes ?? existing.notes,
        metadata: (dto as any).metadata ?? existing.metadata,
        ...(linesOp ? { lines: linesOp } : {}),
      },
      include: { lines: true },
    })
  }
}

