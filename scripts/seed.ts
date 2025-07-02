import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding with updated schema...")

  try {
    // 1. Create Currencies
    // console.log("💰 Creating currencies...")
    // const currencies = [
    //   { code: "PEN", name: "Sol Peruano", symbol: "S/", isActive: true },
    //   { code: "USD", name: "Dólar Americano", symbol: "$", isActive: true },
    //   { code: "EUR", name: "Euro", symbol: "€", isActive: true },
    // ]

    // for (const currency of currencies) {
    //   await prisma.currency.upsert({
    //     where: { code: currency.code },
    //     update: currency,
    //     create: currency,
    //   })
    // }

    // // 2. Create Banks
    // console.log("🏦 Creating banks...")
    // const banks = [
    //   { code: "BCP", name: "Banco de Crédito del Perú", country: "PE", isActive: true },
    //   { code: "BBVA", name: "BBVA Continental", country: "PE", isActive: true },
    //   { code: "INTERBANK", name: "Interbank", country: "PE", isActive: true },
    //   { code: "SCOTIABANK", name: "Scotiabank Perú", country: "PE", isActive: true },
    //   { code: "BIF", name: "Banco Interamericano de Finanzas", country: "PE", isActive: true },
    //   { code: "PICHINCHA", name: "Banco Pichincha", country: "PE", isActive: true },
    //   { code: "FALABELLA", name: "Banco Falabella", country: "PE", isActive: true },
    //   { code: "RIPLEY", name: "Banco Ripley", country: "PE", isActive: true },
    // ]

    // for (const bank of banks) {
    //   await prisma.bank.upsert({
    //     where: { code: bank.code },
    //     update: bank,
    //     create: bank,
    //   })
    // }

    // 3. Create Tax Schemes
    console.log("📊 Creating tax schemes...")
    const taxSchemes = [
  { taxSchemeId: "1000", taxSchemeName: "IGV", taxCategoryId: "S", taxTypeCode: "VAT", taxPercentage: 0.18, isActive: true },
  { taxSchemeId: "9997", taxSchemeName: "IGV Exonerado", taxCategoryId: "E", taxTypeCode: "VAT", taxPercentage: 0.0, isActive: true },
  { taxSchemeId: "9998", taxSchemeName: "IGV Inafecto", taxCategoryId: "O", taxTypeCode: "VAT", taxPercentage: 0.0, isActive: true },
  { taxSchemeId: "9995", taxSchemeName: "IGV Exportación", taxCategoryId: "G", taxTypeCode: "VAT", taxPercentage: 0.0, isActive: true },
  { taxSchemeId: "2000", taxSchemeName: "ISC", taxCategoryId: "S", taxTypeCode: "EXC", taxPercentage: 0.17, isActive: true }, // Corregido: ISC cigarrillos es 17%
  { taxSchemeId: "7152", taxSchemeName: "ICBPER", taxCategoryId: "S", taxTypeCode: "OTH", taxPercentage: 0.0, taxAmount: 0.50, isActive: true }, // Impuesto bolsas plásticas
  { taxSchemeId: "9993", taxSchemeName: "Retención IGV", taxCategoryId: "RET", taxTypeCode: "RET", taxPercentage: 0.03, isActive: true }, // 3% retención IGV
  { taxSchemeId: "9992", taxSchemeName: "Retención Renta", taxCategoryId: "RET", taxTypeCode: "RET", taxPercentage: 0.08, isActive: true }, // 8% retención 4ta categoría
  { taxSchemeId: "9999", taxSchemeName: "Otros", taxCategoryId: "Z", taxTypeCode: "OTH", taxPercentage: 0.0, isActive: true },
]

    for (const taxScheme of taxSchemes) {
      await prisma.taxScheme.upsert({
        where: { taxSchemeId: taxScheme.taxSchemeId },
        update: taxScheme,
        create: taxScheme,
      })
    }

    // 4. Create Company with new fields
    // console.log("🏢 Creating SICLO company...")
    // const company = await prisma.company.upsert({
    //   where: { ruc: "20604004617" },
    //   update: {
    //     name: "SICLO",
    //     tradeName: "GRUPO REVOLUCIONES S.A.C.",
    //     address: "Av. Principal 123, Lima",
    //     phone: "+51 1 234-5678",
    //     email: "elsa@siclo.com",
    //     website: "https://siclo.com",
    //     logo: "https://siclo.com/logo.png",
    //     settings: {
    //       timezone: "America/Lima",
    //       currency: "PEN",
    //       fiscalYear: "calendar",
    //       retentionAgent: false,
    //       retentionRate: 0.03,
    //     },
    //     isActive: true,
    //   },
    //   create: {
    //     name: "SICLO",
    //     tradeName: "GRUPO REVOLUCIONES S.A.C.",
    //     ruc: "20604004617",
    //     address: "Av. Principal 123, Lima",
    //     phone: "+51 1 234-5678",
    //     email: "elsa@siclo.com",
    //     website: "https://siclo.com",
    //     logo: "https://siclo.com/logo.png",
    //     settings: {
    //       timezone: "America/Lima",
    //       currency: "PEN",
    //       fiscalYear: "calendar",
    //       retentionAgent: false,
    //       retentionRate: 0.03,
    //     },
    //     isActive: true,
    //   },
    // })

    // // 5. Create User with new fields
    // console.log("👤 Creating admin user...")
    // const hashedPassword = await bcrypt.hash("123123", 10)

    // const user = await prisma.user.upsert({
    //   where: { email: "elsa@siclo.com" },
    //   update: {
    //     firstName: "Elsa",
    //     lastName: "Siclo",
    //     phone: "+51 999 888 777",
    //     role: "ADMIN",
    //     authProvider: "EMAIL",
    //     companyId: company.id,
    //     password: hashedPassword,
    //     image: "https://siclo.com/avatars/elsa.jpg",
    //     bio: "CEO y Fundadora de SICLO",
    //     preferences: {
    //       language: "es",
    //       theme: "light",
    //       notifications: {
    //         email: true,
    //         push: true,
    //         sms: false,
    //       },
    //       dashboard: {
    //         defaultView: "overview",
    //         refreshInterval: 300,
    //       },
    //     },
    //     isActive: true,
    //     failedLoginAttempts: 0,
    //   },
    //   create: {
    //     firstName: "Elsa",
    //     lastName: "Siclo",
    //     email: "elsa@siclo.com",
    //     password: hashedPassword,
    //     phone: "+51 999 888 777",
    //     role: "ADMIN",
    //     authProvider: "EMAIL",
    //     companyId: company.id,
    //     image: "https://siclo.com/avatars/elsa.jpg",
    //     bio: "CEO y Fundadora de SICLO",
    //     preferences: {
    //       language: "es",
    //       theme: "light",
    //       notifications: {
    //         email: true,
    //         push: true,
    //         sms: false,
    //       },
    //       dashboard: {
    //         defaultView: "overview",
    //         refreshInterval: 300,
    //       },
    //     },
    //     isActive: true,
    //     failedLoginAttempts: 0,
    //   },
    // })

    // // 6. Create Accounting Accounts (same as before but with updated structure)
    // console.log("📚 Creating accounting accounts...")
    // const accountingAccounts = [
    //   // Revenue Accounts
    //   {
    //     accountCode: "4001",
    //     accountName: "Ingresos por Clases",
    //     accountType: "REVENUE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Ingresos generados por clases de fitness",
    //   },
    //   {
    //     accountCode: "4002",
    //     accountName: "Ingresos por Productos",
    //     accountType: "REVENUE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Ingresos por venta de productos",
    //   },
    //   {
    //     accountCode: "4003",
    //     accountName: "Ingresos por Membresías",
    //     accountType: "REVENUE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Ingresos por membresías mensuales/anuales",
    //   },

    //   // COGS Accounts
    //   {
    //     accountCode: "5001",
    //     accountName: "Comisión de clases",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Comisiones pagadas a instructores",
    //   },
    //   {
    //     accountCode: "5002",
    //     accountName: "Comisión de productos",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Comisiones por venta de productos",
    //   },
    //   {
    //     accountCode: "5003",
    //     accountName: "Costo de productos",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Costo directo de productos vendidos",
    //   },

    //   // SG&A Accounts
    //   {
    //     accountCode: "6001",
    //     accountName: "Renta & Mantenimiento",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Gastos de alquiler y mantenimiento de locales",
    //   },
    //   {
    //     accountCode: "6002",
    //     accountName: "Personal Operativo",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Sueldos y beneficios del personal operativo",
    //   },
    //   {
    //     accountCode: "6003",
    //     accountName: "Servicios Públicos",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Electricidad, agua, gas, internet",
    //   },
    //   {
    //     accountCode: "6004",
    //     accountName: "Limpieza y Mantenimiento",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Servicios de limpieza y mantenimiento",
    //   },

    //   // Corporate Accounts
    //   {
    //     accountCode: "7001",
    //     accountName: "Sueldos Corporativos",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Sueldos del personal corporativo",
    //   },
    //   {
    //     accountCode: "7002",
    //     accountName: "Marketing y Publicidad",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Gastos de marketing y publicidad",
    //   },
    //   {
    //     accountCode: "7003",
    //     accountName: "Servicios Profesionales",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Servicios legales, contables, consultorías",
    //   },
    //   {
    //     accountCode: "7004",
    //     accountName: "Tecnología",
    //     accountType: "EXPENSE",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Software, licencias, equipos tecnológicos",
    //   },

    //   // Asset Accounts
    //   {
    //     accountCode: "1001",
    //     accountName: "Caja y Bancos",
    //     accountType: "ASSET",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Efectivo y equivalentes de efectivo",
    //   },
    //   {
    //     accountCode: "1002",
    //     accountName: "Cuentas por Cobrar",
    //     accountType: "ASSET",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Cuentas por cobrar comerciales",
    //   },
    //   {
    //     accountCode: "1003",
    //     accountName: "Inventarios",
    //     accountType: "ASSET",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Inventario de productos",
    //   },
    //   {
    //     accountCode: "1004",
    //     accountName: "Activos Fijos",
    //     accountType: "ASSET",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Equipos, muebles, instalaciones",
    //   },

    //   // Liability Accounts
    //   {
    //     accountCode: "2001",
    //     accountName: "Cuentas por Pagar",
    //     accountType: "LIABILITY",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Cuentas por pagar comerciales",
    //   },
    //   {
    //     accountCode: "2002",
    //     accountName: "Tributos por Pagar",
    //     accountType: "LIABILITY",
    //     level: 1,
    //     companyId: company.id,
    //     description: "IGV, renta, otros impuestos por pagar",
    //   },
    //   {
    //     accountCode: "2003",
    //     accountName: "Remuneraciones por Pagar",
    //     accountType: "LIABILITY",
    //     level: 1,
    //     companyId: company.id,
    //     description: "Sueldos, beneficios sociales por pagar",
    //   },
    // ]

    // for (const account of accountingAccounts) {
    //   await prisma.accountingAccount.upsert({
    //     where: {
    //       companyId_accountCode: {
    //         companyId: account.companyId,
    //         accountCode: account.accountCode,
    //       },
    //     },
    //     update: account,
    //     create: account,
    //   })
    // }

    // // 7. Create Cost Centers (same as before)
    // console.log("🎯 Creating cost centers...")
    // const costCenters = [
    //   // CYCLING
    //   {
    //     code: "1001",
    //     name: "CYCLING - REDUCTO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de cycling en Reducto",
    //     isActive: true,
    //   },
    //   {
    //     code: "1002",
    //     name: "CYCLING - SAN ISIDRO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de cycling en San Isidro",
    //     isActive: true,
    //   },
    //   {
    //     code: "1003",
    //     name: "CYCLING - PRIMAVERA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de cycling en Primavera",
    //     isActive: true,
    //   },
    //   {
    //     code: "1004",
    //     name: "CYCLING - LA ESTANCIA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de cycling en La Estancia",
    //     isActive: true,
    //   },
    //   {
    //     code: "1005",
    //     name: "CYCLING - ASIA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de cycling en Asia",
    //     isActive: true,
    //   },
    //   {
    //     code: "1006",
    //     name: "CYCLING - OUTDOORS",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Clases de cycling al aire libre",
    //     isActive: true,
    //   },
    //   {
    //     code: "1007",
    //     name: "CYCLING - OTROS",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Otros servicios de cycling",
    //     isActive: true,
    //   },

    //   // YOGA
    //   {
    //     code: "2001",
    //     name: "YOGA - PRIMAVERA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de yoga en Primavera",
    //     isActive: true,
    //   },
    //   {
    //     code: "2002",
    //     name: "YOGA - LA ESTANCIA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de yoga en La Estancia",
    //     isActive: true,
    //   },
    //   {
    //     code: "2003",
    //     name: "YOGA - OUTDOORS",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Clases de yoga al aire libre",
    //     isActive: true,
    //   },
    //   {
    //     code: "2004",
    //     name: "YOGA - SAN ISIDRO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de yoga en San Isidro",
    //     isActive: true,
    //   },
    //   {
    //     code: "2005",
    //     name: "YOGA - ASIA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de yoga en Asia",
    //     isActive: true,
    //   },
    //   {
    //     code: "2006",
    //     name: "YOGA - REDUCTO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de yoga en Reducto",
    //     isActive: true,
    //   },

    //   // BARRE
    //   {
    //     code: "3001",
    //     name: "BARRE - PRIMAVERA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de barre en Primavera",
    //     isActive: true,
    //   },
    //   {
    //     code: "3002",
    //     name: "BARRE - LA ESTANCIA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de barre en La Estancia",
    //     isActive: true,
    //   },
    //   {
    //     code: "3003",
    //     name: "BARRE - ASIA",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de barre en Asia",
    //     isActive: true,
    //   },
    //   {
    //     code: "3004",
    //     name: "BARRE - OUTDOORS",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Clases de barre al aire libre",
    //     isActive: true,
    //   },
    //   {
    //     code: "3005",
    //     name: "BARRE - SAN ISIDRO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de barre en San Isidro",
    //     isActive: true,
    //   },
    //   {
    //     code: "3006",
    //     name: "BARRE - REDUCTO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de barre en Reducto",
    //     isActive: true,
    //   },

    //   // BALA
    //   {
    //     code: "4001",
    //     name: "BALA - SAN ISIDRO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de bala en San Isidro",
    //     isActive: true,
    //   },
    //   {
    //     code: "4002",
    //     name: "BALA - REDUCTO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Centro de bala en Reducto",
    //     isActive: true,
    //   },

    //   // CORPORATIVO
    //   {
    //     code: "6001",
    //     name: "CORPORATIVO",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Gastos corporativos generales",
    //     isActive: true,
    //   },

    //   // SICLO PLUS
    //   {
    //     code: "7001",
    //     name: "SICLO PLUS",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Servicios premium SICLO Plus",
    //     isActive: true,
    //   },

    //   // OTROS
    //   {
    //     code: "8001",
    //     name: "OTROS",
    //     companyId: company.id,
    //     level: 1,
    //     description: "Otros gastos no clasificados",
    //     isActive: true,
    //   },
    // ]

    // for (const costCenter of costCenters) {
    //   await prisma.costCenter.upsert({
    //     where: {
    //       companyId_code: {
    //         companyId: costCenter.companyId,
    //         code: costCenter.code,
    //       },
    //     },
    //     update: costCenter,
    //     create: costCenter,
    //   })
    // }

    // // 8. Create Expense Categories with updated structure
    // console.log("📂 Creating expense categories...")
    // const expenseCategories = [
    //   {
    //     companyId: company.id,
    //     discipline: "CYCLING",
    //     location: "REDUCTO",
    //     generalCategory: "Operativos",
    //     type: "COGS",
    //     account: "Comisión de clases",
    //     subAccount: null,
    //     accountingAccount: "5001",
    //     description: "Comisiones de instructores de cycling en Reducto",
    //     isActive: true,
    //   },
    //   {
    //     companyId: company.id,
    //     discipline: "YOGA",
    //     location: "SAN ISIDRO",
    //     generalCategory: "Operativos",
    //     type: "COGS",
    //     account: "Comisión de clases",
    //     subAccount: null,
    //     accountingAccount: "5001",
    //     description: "Comisiones de instructores de yoga en San Isidro",
    //     isActive: true,
    //   },
    //   {
    //     companyId: company.id,
    //     discipline: "GENERAL",
    //     location: "CORPORATIVO",
    //     generalCategory: "Administrativos",
    //     type: "SG&A",
    //     account: "Renta & Mantenimiento",
    //     subAccount: "Mantenimiento A",
    //     accountingAccount: "6001",
    //     description: "Gastos de mantenimiento general",
    //     isActive: true,
    //   },
    //   {
    //     companyId: company.id,
    //     discipline: "GENERAL",
    //     location: "CORPORATIVO",
    //     generalCategory: "Corporativos",
    //     type: "CORP",
    //     account: "Sueldos y beneficios",
    //     subAccount: "Asimilados",
    //     accountingAccount: "7001",
    //     description: "Sueldos del personal corporativo",
    //     isActive: true,
    //   },
    //   {
    //     companyId: company.id,
    //     discipline: "GENERAL",
    //     location: "CORPORATIVO",
    //     generalCategory: "Corporativos",
    //     type: "CORP",
    //     account: "Marketing",
    //     subAccount: "Gastos Clase PR / Operacion",
    //     accountingAccount: "7002",
    //     description: "Gastos de marketing y relaciones públicas",
    //     isActive: true,
    //   },
    // ]

    // for (const category of expenseCategories) {
    //   await prisma.expenseCategory.create({
    //     data: category,
    //   })
    // }

    // console.log("✅ Database seeding completed successfully!")
    // console.log(`🏢 Company created: ${company.name} (ID: ${company.id})`)
    // console.log(`👤 Admin user created: ${user.email}`)
    // console.log(`💰 ${currencies.length} currencies created`)
    // console.log(`🏦 ${banks.length} banks created`)
    // console.log(`📚 ${accountingAccounts.length} accounting accounts created`)
    // console.log(`🎯 ${costCenters.length} cost centers created`)
    // console.log(`📂 ${expenseCategories.length} expense categories created`)
  } catch (error) {
    console.error("❌ Error during seeding:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
