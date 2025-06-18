import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateTaxSchemeDto } from "./dto/create-tax-scheme.dto"
import { UpdateTaxSchemeDto } from "./dto/update-tax-scheme.dto"
import { TaxSchemeResponseDto } from "./dto/tax-scheme-response.dto"

@Injectable()
export class TaxSchemesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaxSchemeDto: CreateTaxSchemeDto): Promise<TaxSchemeResponseDto> {
    // Check if taxSchemeId already exists
    const existingTaxScheme = await this.prisma.taxScheme.findUnique({
      where: { taxSchemeId: createTaxSchemeDto.taxSchemeId },
    })

    if (existingTaxScheme) {
      throw new BadRequestException(`Tax scheme with ID ${createTaxSchemeDto.taxSchemeId} already exists`)
    }

    const taxScheme = await this.prisma.taxScheme.create({
      data: createTaxSchemeDto,
    })

    return this.mapToResponseDto(taxScheme)
  }

  async findAll(): Promise<TaxSchemeResponseDto[]> {
    const taxSchemes = await this.prisma.taxScheme.findMany({
      orderBy: { createdAt: "desc" },
    })

    return taxSchemes.map((taxScheme) => this.mapToResponseDto(taxScheme))
  }

  async findOne(id: string): Promise<TaxSchemeResponseDto> {
    const taxScheme = await this.prisma.taxScheme.findUnique({
      where: { id },
    })

    if (!taxScheme) {
      throw new NotFoundException("Tax scheme not found")
    }

    return this.mapToResponseDto(taxScheme)
  }

  async update(id: string, updateTaxSchemeDto: UpdateTaxSchemeDto): Promise<TaxSchemeResponseDto> {
    const existingTaxScheme = await this.prisma.taxScheme.findUnique({
      where: { id },
    })

    if (!existingTaxScheme) {
      throw new NotFoundException("Tax scheme not found")
    }

    // Check if taxSchemeId is being updated and if it already exists
    if (updateTaxSchemeDto.taxSchemeId && updateTaxSchemeDto.taxSchemeId !== existingTaxScheme.taxSchemeId) {
      const duplicateTaxScheme = await this.prisma.taxScheme.findUnique({
        where: { taxSchemeId: updateTaxSchemeDto.taxSchemeId },
      })

      if (duplicateTaxScheme) {
        throw new BadRequestException(`Tax scheme with ID ${updateTaxSchemeDto.taxSchemeId} already exists`)
      }
    }

    const updatedTaxScheme = await this.prisma.taxScheme.update({
      where: { id },
      data: updateTaxSchemeDto,
    })

    return this.mapToResponseDto(updatedTaxScheme)
  }

  async remove(id: string): Promise<void> {
    const taxScheme = await this.prisma.taxScheme.findUnique({
      where: { id },
      include: {
        documentLines: true,
      },
    })

    if (!taxScheme) {
      throw new NotFoundException("Tax scheme not found")
    }

    // Check if tax scheme is being used in document lines
    if (taxScheme.documentLines.length > 0) {
      throw new BadRequestException("Cannot delete tax scheme that is being used in document lines")
    }

    await this.prisma.taxScheme.delete({
      where: { id },
    })
  }

  private mapToResponseDto(taxScheme: any): TaxSchemeResponseDto {
    return {
      id: taxScheme.id,
      taxSchemeId: taxScheme.taxSchemeId,
      taxSchemeName: taxScheme.taxSchemeName,
      taxCategoryId: taxScheme.taxCategoryId,
      taxTypeCode: taxScheme.taxTypeCode,
      taxPercentage: taxScheme.taxPercentage ? taxScheme.taxPercentage.toNumber() : undefined,
      description: taxScheme.description,
      isActive: taxScheme.isActive,
      createdAt: taxScheme.createdAt,
      updatedAt: taxScheme.updatedAt,
    }
  }
}
