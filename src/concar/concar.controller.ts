import { Controller, Get, Query } from "@nestjs/common"
import { ConcarService, ConcarQueryParams } from "./concar.service"

@Controller("concar")
export class ConcarController {
  constructor(private readonly concarService: ConcarService) {}

  @Get()
  async getConcarReport(@Query() query: ConcarQueryParams) {
    console.log("Concar endpoint called with query:", query)
    
    // Validar parámetros
    if (query.startDate && isNaN(Date.parse(query.startDate))) {
      return {
        success: false,
        message: "Invalid startDate format. Use YYYY-MM-DD",
        error: "Invalid startDate format",
        query: query
      }
    }
    
    if (query.endDate && isNaN(Date.parse(query.endDate))) {
      return {
        success: false,
        message: "Invalid endDate format. Use YYYY-MM-DD",
        error: "Invalid endDate format",
        query: query
      }
    }

    // Validar tipos de conciliación
    const validConciliationTypes = ["DOCUMENTS", "DETRACTIONS"]
    if (query.conciliationType && !validConciliationTypes.includes(query.conciliationType)) {
      return {
        success: false,
        message: `Invalid conciliationType. Must be one of: ${validConciliationTypes.join(", ")}`,
        error: "Invalid conciliationType",
        query: query
      }
    }

    // Validar estados
    const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    if (query.status && !validStatuses.includes(query.status)) {
      return {
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        error: "Invalid status",
        query: query
      }
    }

    // Validar limit y offset
    if (query.limit && (isNaN(Number(query.limit)) || Number(query.limit) < 1)) {
      return {
        success: false,
        message: "Invalid limit. Must be a positive number",
        error: "Invalid limit",
        query: query
      }
    }

    if (query.offset && (isNaN(Number(query.offset)) || Number(query.offset) < 0)) {
      return {
        success: false,
        message: "Invalid offset. Must be a non-negative number",
        error: "Invalid offset",
        query: query
      }
    }
    
    try {
      const results = await this.concarService.getConcarReport(query)
      
      return {
        success: true,
        message: "Concar report generated successfully",
        data: results,
        count: results.length,
        query: query
      }
    } catch (error) {
      console.error("Error in Concar controller:", error)
      
      return {
        success: false,
        message: error.message || "Error generating Concar report",
        error: error.message,
        query: query
      }
    }
  }
}
