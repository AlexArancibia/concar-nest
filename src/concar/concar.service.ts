import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

export interface ConcarQueryParams {
  companyId?: string
  startDate?: string
  endDate?: string
  bankAccountId?: string
  conciliationType?: string
  status?: string
  limit?: number
  offset?: number
}

export interface ConcarResult {
  // Bank accounts
  accountNumber: string
  accountType: string
  currency: string
  alias: string | null
  description: string | null

  // Transactions
  transactionDate: Date | null
  transaction_description: string | null
  transactionType: string | null
  amount: number | null
  balance: number | null
  branch: string | null
  operationNumber: string | null
  operationTime: string | null
  operatorUser: string | null
  utc: string | null
  transaction_reference: string | null

  // Suppliers
  tradeName: string | null
  supplier_documentType: string | null
  supplier_documentNumber: string | null

  // Conciliations
  conciliation_type: string
  bankBalance: number
  bookBalance: number
  toleranceAmount: number
  conciliation_status: string
  additionalExpensesTotal: number
  totalAmount: number | null
  paymentAmount: number | null

  // Conciliation items
  conciliation_item_id: string | null
  itemType: string | null
  documentId: string | null
  documentAmount: number | null
  item_conciliated_amount: number | null
  item_difference: number | null
  distributionPercentage: number | null
  item_status: string | null
  item_notes: string | null
  systemNotes: string | null
  conciliatedBy: string | null

  // Conciliation expenses
  expense_id: string | null
  expense_description: string | null
  expense_amount: number | null
  expenseType: string | null
  accountId: string | null
  expense_notes: string | null
  isTaxDeductible: boolean | null
  supportingDocument: string | null
  expenseDate: Date | null

  // Documents
  document_id: string | null
  document_companyId: string | null
  documentType: string | null
  series: string | null
  number: string | null
  fullNumber: string | null
  supplierId: string | null
  issueDate: Date | null
  issueTime: string | null
  dueDate: Date | null
  receptionDate: Date | null
  document_currency: string | null
  exchangeRate: number | null
  subtotal: number | null
  igv: number | null
  otherTaxes: number | null
  document_total: number | null
  hasRetention: boolean | null
  retentionAmount: number | null
  retentionPercentage: number | null
  netPayableAmount: number | null
  document_conciliated_amount: number | null
  document_pending_amount: number | null
  paymentMethod: string | null
  document_description: string | null
  observations: string | null
  tags: string[] | null
  document_status: string | null
  orderReference: string | null
  contractNumber: string | null
  additionalNotes: string | null
}

@Injectable()
export class ConcarService {
  constructor(private prisma: PrismaService) {}

  async getConcarReport(params: ConcarQueryParams): Promise<ConcarResult[]> {
    console.log("Concar query params:", params)

    // Construir la consulta base
    let query = `
      SELECT
        -- Campos de bank_accounts (alias 'ba')
        ba."accountNumber",
        ba."accountType",
        ba.currency,
        ba.alias,
        ba.description,

        -- Campos de transactions (alias 't')
        t."transactionDate",
        t.description AS transaction_description,
        t."transactionType",
        t.amount,
        t.balance,
        t.branch,
        t."operationNumber",
        t."operationTime",
        t."operatorUser",
        t.utc,
        t.reference AS transaction_reference,

        -- Campos de suppliers (alias 's')
        s."tradeName",
        s."documentType" AS supplier_documentType,
        s."documentNumber" AS supplier_documentNumber,

        -- Campos de conciliations (alias 'c')
        c.type AS conciliation_type,
        c."bankBalance",
        c."bookBalance",
        c."toleranceAmount",
        c.status AS conciliation_status,
        c."additionalExpensesTotal",
        c."totalAmount",
        c."paymentAmount",
        
        -- Campos de conciliation_items (alias 'ci')
        ci.id AS conciliation_item_id,
        ci."itemType",
        ci."documentId",
        ci."documentAmount",
        ci."conciliatedAmount" AS item_conciliated_amount,
        ci.difference AS item_difference,
        ci."distributionPercentage",
        ci.status AS item_status,
        ci.notes AS item_notes,
        ci."systemNotes",
        ci."conciliatedBy",
        
        -- Campos de conciliation_expenses (alias 'ce')
        ce.id AS expense_id,
        ce.description AS expense_description,
        ce.amount AS expense_amount,
        ce."expenseType",
        ce."accountId",
        ce.notes AS expense_notes,
        ce."isTaxDeductible",
        ce."supportingDocument",
        ce."expenseDate",
        
        -- Campos de documents (alias 'd')
        d.id AS document_id,
        d."companyId" AS document_companyId,
        d."documentType",
        d.series,
        d."number",
        d."fullNumber",
        d."supplierId",
        d."issueDate",
        d."issueTime",
        d."dueDate",
        d."receptionDate",
        d.currency AS document_currency,
        d."exchangeRate",
        d.subtotal,
        d.igv,
        d."otherTaxes",
        d.total AS document_total,
        d."hasRetention",
        d."retentionAmount",
        d."retentionPercentage",
        d."netPayableAmount",
        d."conciliatedAmount" AS document_conciliated_amount,
        d."pendingAmount" AS document_pending_amount,
        d."paymentMethod",
        d.description AS document_description,
        d.observations,
        d.tags,
        d.status AS document_status,
        d."orderReference",
        d."contractNumber",
        d."additionalNotes"
        
      FROM public.conciliations c
      -- Relaciones manteniendo conciliations como eje central
      LEFT JOIN public.bank_accounts ba ON c."bankAccountId" = ba.id
      LEFT JOIN public.transactions t ON c."transactionId" = t.id
      LEFT JOIN public.conciliation_items ci ON c.id = ci."conciliationId"
      LEFT JOIN public.documents d ON ci."documentId" = d.id
      -- Relación con suppliers
      LEFT JOIN public.suppliers s ON d."supplierId" = s.id
      LEFT JOIN public.conciliation_expenses ce ON c.id = ce."conciliationId"
      WHERE 1=1
    `

    const queryParams: any[] = []
    let paramIndex = 1

    // Agregar filtros según los parámetros
    if (params.companyId) {
      query += ` AND c."companyId" = $${paramIndex}`
      queryParams.push(params.companyId)
      paramIndex++
    }

    if (params.startDate) {
      query += ` AND c."periodStart" >= $${paramIndex}::timestamp`
      // Asegurar que la fecha esté en formato ISO
      const startDate = new Date(params.startDate).toISOString()
      queryParams.push(startDate)
      paramIndex++
    }

    if (params.endDate) {
      query += ` AND c."periodEnd" <= $${paramIndex}::timestamp`
      // Asegurar que la fecha esté en formato ISO y ajustar al final del día
      const endDate = new Date(params.endDate)
      endDate.setHours(23, 59, 59, 999)
      queryParams.push(endDate.toISOString())
      paramIndex++
    }

    if (params.bankAccountId) {
      query += ` AND c."bankAccountId" = $${paramIndex}`
      queryParams.push(params.bankAccountId)
      paramIndex++
    }

    if (params.conciliationType) {
      query += ` AND c.type = $${paramIndex}::"ConciliationType"`
      queryParams.push(params.conciliationType)
      paramIndex++
    }

    if (params.status) {
      query += ` AND c.status = $${paramIndex}::"ConciliationStatus"`
      queryParams.push(params.status)
      paramIndex++
    }

    // Ordenar por fecha de conciliación
    query += ` ORDER BY c."periodStart" DESC`

    // Agregar límite y offset si se especifican
    if (params.limit) {
      query += ` LIMIT $${paramIndex}::bigint`
      queryParams.push(params.limit)
      paramIndex++
    }

    if (params.offset) {
      query += ` OFFSET $${paramIndex}::bigint`
      queryParams.push(params.offset)
      paramIndex++
    }

    console.log("SQL Query:", query)
    console.log("Query params:", queryParams)
    console.log("Param types:", queryParams.map(p => typeof p))

    try {
      // Ejecutar la consulta usando Prisma
      const results = await this.prisma.$queryRawUnsafe<ConcarResult[]>(query, ...queryParams)
      
      console.log(`Concar report generated with ${results.length} results`)
      return results
    } catch (error) {
      console.error("Error executing Concar query:", error)
      throw new Error(`Error generating Concar report: ${error.message}`)
    }
  }
}
