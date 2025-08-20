import { IsArray, IsString, ArrayMinSize } from "class-validator"

export class BulkDeleteConciliationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  conciliationIds: string[]
}
