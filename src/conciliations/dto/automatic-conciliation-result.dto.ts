export interface AutomaticConciliationResultDto {
  matchedDocuments: number;
  totalAmount: number;
  items: Array<{
    // Define properties for items returned by automatic conciliation
    // This might include document details, conciliated amounts, etc.
    // Example:
    documentId: string;
    conciliatedAmount: number;
    status: string; // e.g., 'MATCHED', 'PARTIAL'
    // Add other relevant properties based on performAutomaticConciliation service method
  }>;
}
