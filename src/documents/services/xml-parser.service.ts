import { Injectable } from "@nestjs/common"
import { parseStringPromise } from "xml2js"

export interface ParsedDocument {
  // Información básica del documento
  documentId: string
  series: string
  number: string
  issueDate: string
  issueTime?: string
  documentType: string
  invoiceTypeCode: string
  note?: string
  notes?: string[]
  operationNotes?: string[]
  ublVersionId?: string
  customizationId?: string

  // Información del emisor (supplier)
  supplierRuc: string
  supplierName: string
  supplierAddress: string
  supplierPhone?: string
  supplierCity?: string
  supplierProvince?: string
  supplierDistrict?: string

  // Información del cliente (campos actualizados)
  customerDocumentNumber: string // Cambiado de customerRuc
  customerDocumentType: string
  customerName: string
  customerAddress: string
  customerUbigeo?: string
  customerCity?: string
  customerProvince?: string
  customerDistrict?: string

  // Información monetaria
  currency: string
  subtotal: number
  igv: number
  totalAmount: number
  payableAmount: number
  allowanceTotal?: number
  chargeTotal?: number

  // Información de retención
  hasRetention?: boolean
  retentionAmount?: number
  retentionPercentage?: number
  retentionCode?: string

  // Información de pago (campos actualizados)
  paymentMethod: string
  creditAmount?: number
  creditDueDate?: string
  installmentAmount?: number
  installmentDueDate?: string
  paymentTerms: Array<{
    id: string
    method: string
    amount: number
    dueDate?: string
    percentage?: number
  }>

  // Información de detracciones (campos actualizados)
  hasDetraction: boolean
  detractionAmount?: number
  detractionPercent?: number
  detractionCode?: string
  detractionServiceCode?: string // Nuevo campo
  detractionAccount?: string

  // Líneas del documento (campos actualizados)
  lines: Array<{
    lineNumber: string
    description: string
    quantity: number
    unitCode: string
    unitPrice: number
    unitPriceWithTax?: number // Nuevo campo
    lineTotal: number
    taxAmount: number
    taxPercent?: number
    taxCategoryId?: string // Actualizado
    taxSchemeId?: string // Nuevo campo
    taxSchemeName?: string // Nuevo campo
    taxTypeCode?: string // Nuevo campo
    taxExemptionCode?: string
    taxExemptionReason?: string // Nuevo campo
    priceTypeCode?: string
    referencePrice?: number
    freeOfCharge?: boolean
    itemClassificationCode?: string // Nuevo campo
    taxableAmount?: number // Nuevo campo
    exemptAmount?: number // Nuevo campo
    inaffectedAmount?: number // Nuevo campo
    allowanceAmount?: number // Nuevo campo
    chargeAmount?: number // Nuevo campo
    allowanceIndicator?: boolean // Nuevo campo
    chargeIndicator?: boolean // Nuevo campo
    orderLineReference?: string // Nuevo campo
    lineNotes?: string[] // Nuevo campo
    additionalData?: any // Para xmlLineData
  }>

  // Información tributaria
  taxTotals: Array<{
    taxableAmount: number
    taxAmount: number
    taxCategory: string
    taxPercent?: number
    taxSchemeId?: string
    taxSchemeName?: string
    taxExemptionCode?: string
  }>

  // Información de firma digital (campos actualizados)
  digitalSignature?: {
    signatureValue: string
    certificateIssuer: string
    certificateSubject?: string // Nuevo campo
    signingTime?: string
    certificateSerial?: string
    certificateData?: string // Nuevo campo
    canonicalizationMethod?: string // Nuevo campo
    signatureMethod?: string // Nuevo campo
    digestMethod?: string // Nuevo campo
    digestValue?: string // Nuevo campo
  }

  // Metadatos del documento
  documentClass: "RHE" | "FACTURA" | "BOLETA" | "NOTA_CREDITO" | "NOTA_DEBITO"
  isElectronic: boolean
  sunatCompliant: boolean

  // Información adicional
  orderReference?: string
  contractNumber?: string
  additionalData?: any // Para xmlAdditionalData
}

@Injectable()
export class XmlParserService {
  async parseDocument(xmlContent: string): Promise<ParsedDocument> {
    try {
      const parsedXml = await parseStringPromise(xmlContent, {
        explicitArray: false,
        ignoreAttrs: false,
        tagNameProcessors: [this.stripNamespace],
      })

      const invoice = parsedXml.Invoice

      // Determinar el tipo de documento
      const documentClass = this.determineDocumentClass(invoice, xmlContent)

      // Determinar si tiene retención (especialmente para RHE)
      const hasRetention = this.hasRetention(invoice, documentClass)
      const retentionAmount = this.calculateRetentionAmount(invoice, documentClass)
      const retentionPercentage = this.getRetentionPercentage(invoice, documentClass)

      const baseDocument = {
        // Información básica
        documentId: invoice.ID,
        series: this.extractSeries(invoice.ID),
        number: this.extractNumber(invoice.ID),
        issueDate: invoice.IssueDate,
        issueTime: invoice.IssueTime,
        documentType: this.getDocumentTypeFromCode(invoice.InvoiceTypeCode),
        invoiceTypeCode: this.extractInvoiceTypeCode(invoice.InvoiceTypeCode),
        note: this.extractNote(invoice.Note),
        notes: this.extractNotes(invoice.Note),
        operationNotes: this.extractOperationNotes(invoice.Note),
        ublVersionId: invoice.UBLVersionID,
        customizationId: invoice.CustomizationID,

        // Información del emisor
        supplierRuc: this.extractSupplierRuc(invoice),
        supplierName: this.extractSupplierName(invoice),
        supplierAddress: this.extractSupplierAddress(invoice),
        supplierPhone: this.extractSupplierPhone(invoice),
        supplierCity: this.extractSupplierCity(invoice),
        supplierProvince: this.extractSupplierProvince(invoice),
        supplierDistrict: this.extractSupplierDistrict(invoice),

        // Información del cliente (campos actualizados)
        customerDocumentNumber: this.extractCustomerRuc(invoice),
        customerDocumentType: this.extractCustomerDocumentType(invoice),
        customerName: this.extractCustomerName(invoice),
        customerAddress: this.extractCustomerAddress(invoice),
        customerUbigeo: this.extractCustomerUbigeo(invoice),
        customerCity: this.extractCustomerCity(invoice),
        customerProvince: this.extractCustomerProvince(invoice),
        customerDistrict: this.extractCustomerDistrict(invoice),

        // Información monetaria
        currency: this.extractCurrency(invoice),
        subtotal: this.extractSubtotal(invoice),
        igv: this.extractIGV(invoice),
        totalAmount: this.extractTotalAmount(invoice),
        payableAmount: this.extractPayableAmount(invoice),
        allowanceTotal: this.extractAllowanceTotal(invoice),
        chargeTotal: this.extractChargeTotal(invoice),

        // Información de retención
        hasRetention,
        retentionAmount,
        retentionPercentage,

        // Información de pago (campos actualizados)
        paymentMethod: this.extractPaymentMethod(invoice.PaymentTerms),
        creditAmount: this.extractCreditAmount(invoice.PaymentTerms),
        creditDueDate: this.extractCreditDueDate(invoice.PaymentTerms),
        installmentAmount: this.extractInstallmentAmount(invoice.PaymentTerms),
        installmentDueDate: this.extractInstallmentDueDate(invoice.PaymentTerms),
        paymentTerms: this.extractPaymentTerms(invoice.PaymentTerms),

        // Información de detracciones (campos actualizados)
        hasDetraction: this.hasDetraction(invoice),
        detractionAmount: this.extractDetractionAmount(invoice),
        detractionPercent: this.extractDetractionPercent(invoice),
        detractionCode: this.extractDetractionCode(invoice),
        detractionServiceCode: this.extractDetractionServiceCode(invoice),
        detractionAccount: this.extractDetractionAccount(invoice),

        // Líneas del documento
        lines: this.extractInvoiceLines(invoice.InvoiceLine),

        // Información tributaria
        taxTotals: this.extractTaxTotals(invoice.TaxTotal),

        // Información de firma digital
        digitalSignature: this.extractDigitalSignature(invoice),

        // Información adicional
        orderReference: this.extractOrderReference(invoice),
        contractNumber: this.extractContractNumber(invoice),

        // Metadatos
        documentClass,
        isElectronic: true,
        sunatCompliant: true,

        // Datos adicionales
        additionalData: {
          xmlStructure: this.extractAdditionalXmlData(invoice),
          processingMetadata: {
            parsingDate: new Date().toISOString(),
            xmlSize: xmlContent.length,
          },
        },
      }

      return baseDocument
    } catch (error) {
      throw new Error(`Error parsing XML document: ${error.message}`)
    }
  }

  private stripNamespace(name: string): string {
    return name.replace(/^.+:/, "")
  }

  private determineDocumentClass(
    invoice: any,
    xmlContent: string,
  ): "RHE" | "FACTURA" | "BOLETA" | "NOTA_CREDITO" | "NOTA_DEBITO" {
    // Verificar si es RHE por características específicas
    if (
      xmlContent.includes("SERVICIOS DE CAPACITACION") ||
      xmlContent.includes("RET 4TA") ||
      this.isRHEDocument(invoice)
    ) {
      return "RHE"
    }

    const typeCode = this.extractInvoiceTypeCode(invoice.InvoiceTypeCode)

    switch (typeCode) {
      case "01":
        return "FACTURA"
      case "03":
        return "BOLETA"
      case "07":
        return "NOTA_CREDITO"
      case "08":
        return "NOTA_DEBITO"
      default:
        return "FACTURA"
    }
  }

  private isRHEDocument(invoice: any): boolean {
    // Verificar características típicas de RHE
    const lines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine]

    return lines.some((line) => {
      const taxSubtotal = line.TaxTotal?.TaxSubtotal
      return taxSubtotal?.TaxCategory?.ID === "RET 4TA" || taxSubtotal?.Percent === "8.00"
    })
  }

  // Métodos para retención
  private hasRetention(invoice: any, documentClass: string): boolean {
    if (documentClass === "RHE") {
      return true // RHE siempre tiene retención del 8%
    }

    const lines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine]
    return lines.some((line) => {
      const taxSubtotal = line.TaxTotal?.TaxSubtotal
      return taxSubtotal?.TaxCategory?.ID === "RET 4TA" || taxSubtotal?.Percent === "8.00"
    })
  }

  private calculateRetentionAmount(invoice: any, documentClass: string): number {
    if (documentClass === "RHE") {
      // Para RHE, la retención es del 8% del monto total
      const totalAmount = this.extractTotalAmount(invoice)
      return totalAmount * 0.08
    }

    // Para otros documentos, buscar en las líneas
    const lines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine]
    let retentionAmount = 0

    lines.forEach((line) => {
      const taxSubtotal = line.TaxTotal?.TaxSubtotal
      if (taxSubtotal?.TaxCategory?.ID === "RET 4TA") {
        retentionAmount += Number(taxSubtotal.TaxAmount?._ || taxSubtotal.TaxAmount || 0)
      }
    })

    return retentionAmount
  }

  private getRetentionPercentage(invoice: any, documentClass: string): number {
    if (documentClass === "RHE") {
      return 8 // RHE siempre tiene retención del 8%
    }

    const lines = Array.isArray(invoice.InvoiceLine) ? invoice.InvoiceLine : [invoice.InvoiceLine]
    for (const line of lines) {
      const taxSubtotal = line.TaxTotal?.TaxSubtotal
      if (taxSubtotal?.TaxCategory?.ID === "RET 4TA") {
        return Number(taxSubtotal.Percent || 0)
      }
    }

    return 0
  }

  private extractSeries(documentId: string): string {
    const parts = documentId.split("-")
    return parts[0] || ""
  }

  private extractNumber(documentId: string): string {
    const parts = documentId.split("-")
    return parts[1] || ""
  }

  private extractInvoiceTypeCode(typeCodeElement: any): string {
    if (typeof typeCodeElement === "string") {
      return typeCodeElement
    }
    return typeCodeElement?._ || typeCodeElement || "01"
  }

  private extractNote(noteElement: any): string {
    if (Array.isArray(noteElement)) {
      return noteElement.map((note) => (typeof note === "string" ? note : note._)).join(" | ")
    }
    if (typeof noteElement === "string") {
      return noteElement
    }
    return noteElement?._ || ""
  }

  // Nuevos métodos para extraer notas como arrays
  private extractNotes(noteElement: any): string[] {
    if (Array.isArray(noteElement)) {
      return noteElement.map((note) => (typeof note === "string" ? note : note._))
    }
    if (typeof noteElement === "string") {
      return [noteElement]
    }
    if (noteElement?._) {
      return [noteElement._]
    }
    return []
  }

  private extractOperationNotes(noteElement: any): string[] {
    const notes = this.extractNotes(noteElement)
    return notes.filter(
      (note) =>
        note.toLowerCase().includes("operación") ||
        note.toLowerCase().includes("detracción") ||
        note.toLowerCase().includes("retención"),
    )
  }

  private getDocumentTypeFromCode(code: string): string {
    const documentTypes = {
      "01": "FACTURA",
      "03": "BOLETA",
      "07": "NOTA_CREDITO",
      "08": "NOTA_DEBITO",
      "09": "GUIA_REMISION",
      "12": "TICKET_MAQUINA_REGISTRADORA",
      "13": "DOCUMENTO_EMITIDO_POR_BANCOS",
      "14": "RECIBO_SERVICIOS_PUBLICOS",
      "15": "BOLETO_TRANSPORTE_PUBLICO",
      "16": "BOLETO_VIAJE_TRANSPORTE_PUBLICO",
      "18": "DOCUMENTO_AUTORIZADO_LIBRO_PLANILLAS",
      "19": "BOLETO_ESPECTACULO_PUBLICO",
      "20": "COMPROBANTE_RETENCION",
      "40": "COMPROBANTE_PERCEPCION",
      "41": "COMPROBANTE_PERCEPCION_VENTA_INTERNA",
      "56": "COMPROBANTE_VENTA_ARROZ_PILADO",
    }
    return documentTypes[this.extractInvoiceTypeCode(code)] || "FACTURA"
  }

  // Métodos de extracción del emisor
  private extractSupplierRuc(invoice: any): string {
    return (
      invoice.AccountingSupplierParty?.CustomerAssignedAccountID ||
      invoice.AccountingSupplierParty?.Party?.PartyIdentification?.ID?._ ||
      invoice.AccountingSupplierParty?.Party?.PartyIdentification?.ID ||
      ""
    )
  }

  private extractSupplierName(invoice: any): string {
    return (
      invoice.AccountingSupplierParty?.Party?.PartyName?.Name ||
      invoice.AccountingSupplierParty?.Party?.PartyLegalEntity?.RegistrationName ||
      ""
    )
  }

  private extractSupplierAddress(invoice: any): string {
    return (
      invoice.AccountingSupplierParty?.Party?.PostalAddress?.StreetName ||
      invoice.AccountingSupplierParty?.Party?.PartyLegalEntity?.RegistrationAddress?.AddressLine?.Line ||
      ""
    )
  }

  private extractSupplierPhone(invoice: any): string {
    return invoice.AccountingSupplierParty?.Party?.Contact?.Telephone?.trim() || ""
  }

  private extractSupplierCity(invoice: any): string {
    return invoice.AccountingSupplierParty?.Party?.PartyLegalEntity?.RegistrationAddress?.CityName || ""
  }

  private extractSupplierProvince(invoice: any): string {
    return invoice.AccountingSupplierParty?.Party?.PartyLegalEntity?.RegistrationAddress?.CountrySubentity || ""
  }

  private extractSupplierDistrict(invoice: any): string {
    return invoice.AccountingSupplierParty?.Party?.PartyLegalEntity?.RegistrationAddress?.District || ""
  }

  // Métodos de extracción del cliente (actualizados)
  private extractCustomerRuc(invoice: any): string {
    return (
      invoice.AccountingCustomerParty?.CustomerAssignedAccountID ||
      invoice.AccountingCustomerParty?.Party?.PartyIdentification?.ID?._ ||
      invoice.AccountingCustomerParty?.Party?.PartyIdentification?.ID ||
      ""
    )
  }

  private extractCustomerName(invoice: any): string {
    return (
      invoice.AccountingCustomerParty?.Party?.PartyName?.Name ||
      invoice.AccountingCustomerParty?.Party?.PartyLegalEntity?.RegistrationName ||
      ""
    )
  }

  private extractCustomerAddress(invoice: any): string {
    return (
      invoice.AccountingCustomerParty?.Party?.PostalAddress?.StreetName ||
      invoice.AccountingCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.AddressLine?.Line ||
      invoice.BuyerCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.AddressLine?.Line ||
      ""
    )
  }

  private extractCustomerDocumentType(invoice: any): string {
    return (
      invoice.AccountingCustomerParty?.AdditionalAccountID ||
      invoice.AccountingCustomerParty?.Party?.PartyIdentification?.ID?.$.schemeID ||
      "6"
    )
  }

  // Nuevo método para extraer ubigeo
  private extractCustomerUbigeo(invoice: any): string {
    return (
      invoice.BuyerCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.CountrySubentityCode ||
      invoice.AccountingCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.CountrySubentityCode ||
      ""
    )
  }

  private extractCustomerCity(invoice: any): string {
    return (
      invoice.BuyerCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.CityName ||
      invoice.AccountingCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.CityName ||
      ""
    )
  }

  private extractCustomerProvince(invoice: any): string {
    return (
      invoice.BuyerCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.CountrySubentity ||
      invoice.AccountingCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.CountrySubentity ||
      ""
    )
  }

  private extractCustomerDistrict(invoice: any): string {
    return (
      invoice.BuyerCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.District ||
      invoice.AccountingCustomerParty?.Party?.PartyLegalEntity?.RegistrationAddress?.District ||
      ""
    )
  }

  // Métodos de extracción monetaria
  private extractCurrency(invoice: any): string {
    return (
      invoice.DocumentCurrencyCode ||
      invoice.LegalMonetaryTotal?.PayableAmount?.$.currencyID ||
      invoice.TaxTotal?.TaxAmount?.$.currencyID ||
      "PEN"
    )
  }

  private extractSubtotal(invoice: any): number {
    return Number(
      invoice.LegalMonetaryTotal?.LineExtensionAmount?._ ||
        invoice.LegalMonetaryTotal?.LineExtensionAmount ||
        invoice.LegalMonetaryTotal?.TaxExclusiveAmount?._ ||
        invoice.LegalMonetaryTotal?.TaxExclusiveAmount ||
        0,
    )
  }

  private extractIGV(invoice: any): number {
    return Number(invoice.TaxTotal?.TaxAmount?._ || invoice.TaxTotal?.TaxAmount || 0)
  }

  private extractTotalAmount(invoice: any): number {
    return Number(invoice.LegalMonetaryTotal?.PayableAmount?._ || invoice.LegalMonetaryTotal?.PayableAmount || 0)
  }

  private extractPayableAmount(invoice: any): number {
    return this.extractTotalAmount(invoice)
  }

  private extractAllowanceTotal(invoice: any): number {
    return Number(
      invoice.LegalMonetaryTotal?.AllowanceTotalAmount?._ || invoice.LegalMonetaryTotal?.AllowanceTotalAmount || 0,
    )
  }

  private extractChargeTotal(invoice: any): number {
    return Number(
      invoice.LegalMonetaryTotal?.ChargeTotalAmount?._ || invoice.LegalMonetaryTotal?.ChargeTotalAmount || 0,
    )
  }

  // Métodos de extracción de detracciones (actualizados)
  private hasDetraction(invoice: any): boolean {
    if (!invoice.PaymentMeans && !invoice.PaymentTerms) return false

    const paymentMeans = Array.isArray(invoice.PaymentMeans) ? invoice.PaymentMeans : [invoice.PaymentMeans]
    const paymentTerms = Array.isArray(invoice.PaymentTerms) ? invoice.PaymentTerms : [invoice.PaymentTerms]

    return paymentMeans.some((pm) => pm?.ID === "Detraccion") || paymentTerms.some((pt) => pt?.ID === "Detraccion")
  }

  private extractDetractionAmount(invoice: any): number {
    const paymentTerms = Array.isArray(invoice.PaymentTerms) ? invoice.PaymentTerms : [invoice.PaymentTerms]
    const detractionTerm = paymentTerms.find((pt) => pt?.ID === "Detraccion")

    return Number(detractionTerm?.Amount?._ || detractionTerm?.Amount || 0)
  }

  private extractDetractionPercent(invoice: any): number {
    const paymentTerms = Array.isArray(invoice.PaymentTerms) ? invoice.PaymentTerms : [invoice.PaymentTerms]
    const detractionTerm = paymentTerms.find((pt) => pt?.ID === "Detraccion")

    return Number(detractionTerm?.PaymentPercent || 0)
  }

  private extractDetractionCode(invoice: any): string {
    const paymentTerms = Array.isArray(invoice.PaymentTerms) ? invoice.PaymentTerms : [invoice.PaymentTerms]
    const detractionTerm = paymentTerms.find((pt) => pt?.ID === "Detraccion")

    return detractionTerm?.PaymentMeansID || ""
  }

  // Nuevo método para código de servicio de detracción
  private extractDetractionServiceCode(invoice: any): string {
    const paymentTerms = Array.isArray(invoice.PaymentTerms) ? invoice.PaymentTerms : [invoice.PaymentTerms]
    const detractionTerm = paymentTerms.find((pt) => pt?.ID === "Detraccion")

    return detractionTerm?.PaymentMeansID || ""
  }

  private extractDetractionAccount(invoice: any): string {
    const paymentMeans = Array.isArray(invoice.PaymentMeans) ? invoice.PaymentMeans : [invoice.PaymentMeans]
    const detractionMeans = paymentMeans.find((pm) => pm?.ID === "Detraccion")

    return detractionMeans?.PayeeFinancialAccount?.ID || ""
  }

  // Métodos de pago actualizados
  private extractPaymentMethod(paymentTerms: any): string {
    if (!paymentTerms) return "Contado"

    const terms = Array.isArray(paymentTerms) ? paymentTerms : [paymentTerms]
    const mainTerm = terms.find((term) => term.ID === "FormaPago")

    return mainTerm?.PaymentMeansID || "Contado"
  }

  // Nuevos métodos para información de crédito
  private extractCreditAmount(paymentTerms: any): number {
    if (!paymentTerms) return 0

    const terms = Array.isArray(paymentTerms) ? paymentTerms : [paymentTerms]
    const creditTerm = terms.find((term) => term.PaymentMeansID === "Credito")

    return Number(creditTerm?.Amount?._ || creditTerm?.Amount || 0)
  }

  private extractCreditDueDate(paymentTerms: any): string {
    if (!paymentTerms) return ""

    const terms = Array.isArray(paymentTerms) ? paymentTerms : [paymentTerms]
    const creditTerm = terms.find((term) => term.PaymentMeansID === "Credito")

    return creditTerm?.PaymentDueDate || ""
  }

  private extractInstallmentAmount(paymentTerms: any): number {
    if (!paymentTerms) return 0

    const terms = Array.isArray(paymentTerms) ? paymentTerms : [paymentTerms]
    const installmentTerm = terms.find((term) => term.PaymentMeansID?.includes("Cuota"))

    return Number(installmentTerm?.Amount?._ || installmentTerm?.Amount || 0)
  }

  private extractInstallmentDueDate(paymentTerms: any): string {
    if (!paymentTerms) return ""

    const terms = Array.isArray(paymentTerms) ? paymentTerms : [paymentTerms]
    const installmentTerm = terms.find((term) => term.PaymentMeansID?.includes("Cuota"))

    return installmentTerm?.PaymentDueDate || ""
  }

  private extractPaymentTerms(paymentTerms: any): Array<any> {
    if (!paymentTerms) return []

    const terms = Array.isArray(paymentTerms) ? paymentTerms : [paymentTerms]

    return terms
      .filter((term) => term.ID !== "Detraccion") // Excluir términos de detracción
      .map((term) => ({
        id: term.ID,
        method: term.PaymentMeansID,
        amount: Number(term.Amount?._ || term.Amount || 0),
        dueDate: term.PaymentDueDate || null,
        percentage: Number(term.PaymentPercent || 0),
      }))
  }

  // Método actualizado para líneas de factura
  private extractInvoiceLines(invoiceLines: any): Array<any> {
    if (!invoiceLines) return []

    const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines]

    return lines.map((line) => {
      const taxSubtotal = line.TaxTotal?.TaxSubtotal
      const allowanceCharge = line.AllowanceCharge

      return {
        lineNumber: line.ID,
        description: line.Item?.Description || "",
        quantity: Number(line.InvoicedQuantity?._ || line.InvoicedQuantity || 0),
        unitCode: line.InvoicedQuantity?.$.unitCode || "NIU",
        unitPrice: Number(line.Price?.PriceAmount?._ || line.Price?.PriceAmount || 0),
        unitPriceWithTax: Number(line.PricingReference?.AlternativeConditionPrice?.PriceAmount?._ || 0),
        lineTotal: Number(line.LineExtensionAmount?._ || line.LineExtensionAmount || 0),
        taxAmount: Number(line.TaxTotal?.TaxAmount?._ || line.TaxTotal?.TaxAmount || 0),
        taxPercent: Number(taxSubtotal?.Percent || 0),
        taxCategoryId: taxSubtotal?.TaxCategory?.ID,
        taxSchemeId: taxSubtotal?.TaxCategory?.TaxScheme?.ID,
        taxSchemeName: taxSubtotal?.TaxCategory?.TaxScheme?.Name,
        taxTypeCode: taxSubtotal?.TaxCategory?.TaxScheme?.TaxTypeCode,
        taxExemptionCode: taxSubtotal?.TaxCategory?.TaxExemptionReasonCode,
        taxExemptionReason: this.getTaxExemptionReason(taxSubtotal?.TaxCategory?.TaxExemptionReasonCode),
        priceTypeCode: line.PricingReference?.AlternativeConditionPrice?.PriceTypeCode,
        referencePrice: Number(line.PricingReference?.AlternativeConditionPrice?.PriceAmount?._ || 0),
        freeOfCharge: line.FreeOfChargeIndicator === "true",
        itemClassificationCode: line.Item?.CommodityClassification?.ItemClassificationCode,
        taxableAmount: Number(taxSubtotal?.TaxableAmount?._ || taxSubtotal?.TaxableAmount || 0),
        exemptAmount: this.calculateExemptAmount(taxSubtotal),
        inaffectedAmount: this.calculateInaffectedAmount(taxSubtotal),
        allowanceAmount: Number(allowanceCharge?.Amount?._ || 0),
        chargeAmount: this.calculateChargeAmount(allowanceCharge),
        allowanceIndicator: allowanceCharge?.ChargeIndicator === "false",
        chargeIndicator: allowanceCharge?.ChargeIndicator === "true",
        orderLineReference: line.OrderLineReference?.LineID,
        lineNotes: this.extractLineNotes(line.Note),
        additionalData: {
          sellersItemId: line.Item?.SellersItemIdentification?.ID,
          freeOfChargeIndicator: line.FreeOfChargeIndicator,
        },
      }
    })
  }

  // Métodos auxiliares para líneas
  private getTaxExemptionReason(code: string): string {
    const reasons = {
      "10": "Gravado - Operación Onerosa",
      "20": "Exonerado - Operación Onerosa",
      "30": "Inafecto - Operación Onerosa",
      "40": "Exportación",
    }
    return reasons[code] || ""
  }

  private calculateExemptAmount(taxSubtotal: any): number {
    if (taxSubtotal?.TaxCategory?.TaxExemptionReasonCode === "20") {
      return Number(taxSubtotal?.TaxableAmount?._ || taxSubtotal?.TaxableAmount || 0)
    }
    return 0
  }

  private calculateInaffectedAmount(taxSubtotal: any): number {
    if (taxSubtotal?.TaxCategory?.TaxExemptionReasonCode === "30") {
      return Number(taxSubtotal?.TaxableAmount?._ || taxSubtotal?.TaxableAmount || 0)
    }
    return 0
  }

  private calculateChargeAmount(allowanceCharge: any): number {
    if (allowanceCharge?.ChargeIndicator === "true") {
      return Number(allowanceCharge?.Amount?._ || allowanceCharge?.Amount || 0)
    }
    return 0
  }

  private extractLineNotes(noteElement: any): string[] {
    if (!noteElement) return []
    if (Array.isArray(noteElement)) {
      return noteElement.map((note) => (typeof note === "string" ? note : note._))
    }
    if (typeof noteElement === "string") {
      return [noteElement]
    }
    return noteElement?._ ? [noteElement._] : []
  }

  private extractTaxTotals(taxTotal: any): Array<any> {
    if (!taxTotal) return []

    const subtotals = Array.isArray(taxTotal.TaxSubtotal) ? taxTotal.TaxSubtotal : [taxTotal.TaxSubtotal]

    return subtotals.map((subtotal) => ({
      taxableAmount: Number(subtotal.TaxableAmount?._ || subtotal.TaxableAmount || 0),
      taxAmount: Number(subtotal.TaxAmount?._ || subtotal.TaxAmount || 0),
      taxCategory: subtotal.TaxCategory?.ID,
      taxPercent: Number(subtotal.Percent || subtotal.TaxCategory?.Percent || 0),
      taxSchemeId: subtotal.TaxCategory?.TaxScheme?.ID,
      taxSchemeName: subtotal.TaxCategory?.TaxScheme?.Name,
      taxExemptionCode: subtotal.TaxCategory?.TaxExemptionReasonCode,
    }))
  }

  // Método actualizado para firma digital
  private extractDigitalSignature(invoice: any): any {
    try {
      const extensions = invoice.UBLExtensions?.UBLExtension
      if (!extensions) return null

      const extensionArray = Array.isArray(extensions) ? extensions : [extensions]
      const signatureExtension = extensionArray.find((ext) => ext.ExtensionContent?.Signature)

      if (!signatureExtension) return null

      const signature = signatureExtension.ExtensionContent.Signature

      return {
        signatureValue: signature.SignatureValue,
        certificateIssuer: this.extractCertificateIssuer(signature),
        certificateSubject: this.extractCertificateSubject(signature),
        signingTime: this.extractSigningTime(signature),
        certificateSerial: this.extractCertificateSerial(signature),
        certificateData: signature.KeyInfo?.X509Data?.X509Certificate,
        canonicalizationMethod: signature.SignedInfo?.CanonicalizationMethod?.$.Algorithm,
        signatureMethod: signature.SignedInfo?.SignatureMethod?.$.Algorithm,
        digestMethod: signature.SignedInfo?.Reference?.DigestMethod?.$.Algorithm,
        digestValue: signature.SignedInfo?.Reference?.DigestValue,
      }
    } catch (error) {
      return null
    }
  }

  private extractCertificateIssuer(signature: any): string {
    try {
      return signature.KeyInfo?.X509Data?.X509Certificate || ""
    } catch {
      return ""
    }
  }

  private extractCertificateSubject(signature: any): string {
    try {
      // Extraer información del sujeto del certificado si está disponible
      return (
        signature.Object?.QualifyingProperties?.SignedProperties?.SignedSignatureProperties?.SigningCertificate?.Cert
          ?.IssuerSerial?.X509IssuerName || ""
      )
    } catch {
      return ""
    }
  }

  private extractSigningTime(signature: any): string {
    try {
      return signature.Object?.QualifyingProperties?.SignedProperties?.SignedSignatureProperties?.SigningTime || ""
    } catch {
      return ""
    }
  }

  private extractCertificateSerial(signature: any): string {
    try {
      return (
        signature.Object?.QualifyingProperties?.SignedProperties?.SignedSignatureProperties?.SigningCertificate?.Cert
          ?.IssuerSerial?.X509SerialNumber || ""
      )
    } catch {
      return ""
    }
  }

  // Nuevos métodos para información adicional
  private extractOrderReference(invoice: any): string {
    return invoice.OrderReference?.ID || ""
  }

  private extractContractNumber(invoice: any): string {
    // Buscar en las notas o en campos específicos
    const notes = this.extractNotes(invoice.Note)
    const contractNote = notes.find((note) => note.toLowerCase().includes("contrato"))

    if (contractNote) {
      const match = contractNote.match(/contrato[:\s]*([^\s,]+)/i)
      return match ? match[1] : ""
    }

    return ""
  }

  private extractAdditionalXmlData(invoice: any): any {
    return {
      ublVersionId: invoice.UBLVersionID,
      customizationId: invoice.CustomizationID,
      profileId: invoice.ProfileID,
      profileExecutionId: invoice.ProfileExecutionID,
      documentCurrencyCode: invoice.DocumentCurrencyCode,
      accountingCostCode: invoice.AccountingCostCode,
      lineCountNumeric: invoice.LineCountNumeric,
    }
  }
}
