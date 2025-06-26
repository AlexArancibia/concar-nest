export interface ValidateConciliationResultDto {
  transaction: {
    id: string;
    amount: number;
    description: string;
    date: Date;
  };
  documents: Array<{
    id: string;
    fullNumber: string;
    amount: number;
    supplier?: string;
    issueDate: Date;
  }>;
  summary: {
    transactionAmount: number;
    documentsTotal: number;
    difference: number;
    tolerance: number;
    isWithinTolerance: boolean;
    canConciliate: boolean;
  };
}
