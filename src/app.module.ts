import { Module } from "@nestjs/common"
import { PrismaModule } from "./prisma/prisma.module"
import { AuthModule } from "./auth/auth.module"
import { MulterModule } from "@nestjs/platform-express"
import { join } from "path"
import { FILE_UPLOADS_DIR } from "lib/constants"
import { ServeStaticModule } from "@nestjs/serve-static"
import { ConfigModule } from "@nestjs/config"
import { EmailModule } from "./email/email.module"
import { DocumentsModule } from './documents/documents.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { BankAccountsModule } from "./bank-accounts/bank-accounts.module"
import { CompaniesModule } from "./companies/companies.module"
import { AuditLogsModule } from "./audit-logs/audit-logs.module"
import { ConciliationsModule } from "./conciliations/conciliations.module"
import { TransactionsModule } from "./transactions/transactions.module"
import { SunatModule } from './sunat/sunat.module';
import { AccountingModule } from './accounting/accounting.module';
import { BanksModule } from './banks/banks.module';
import { TaxSchemesModule } from "./tax-scheme/tax-scheme.module"
 

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "files"), // Asegúrate de que la carpeta sea correcta
      serveRoot: "/uploads", // La URL base para acceder a las imágenes
    }),
    PrismaModule,
    AuthModule,
    MulterModule.register({
      dest: FILE_UPLOADS_DIR,
      limits: {
        fileSize: 1000 * 1000 * 10, // 10MB
      },
    }),
 
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    EmailModule,
    DocumentsModule,
    BankAccountsModule,
    AuditLogsModule,
    ConciliationsModule,
    TransactionsModule,
    CompaniesModule,
    ExpensesModule,
    SuppliersModule,
    SunatModule,
    AccountingModule,
    BanksModule,
    TaxSchemesModule,
  ],
})
export class AppModule {}
