export class TaxSchemeResponseDto {
  id: string
  taxSchemeId: string
  taxSchemeName: string
  taxCategoryId?: string
  taxTypeCode?: string
  taxPercentage?: number
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
