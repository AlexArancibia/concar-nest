import { PartialType } from "@nestjs/mapped-types"
import { CreateConciliationExpenseDto } from "./create-conciliation-expense.dto"

export class UpdateConciliationExpenseDto extends PartialType(CreateConciliationExpenseDto){}