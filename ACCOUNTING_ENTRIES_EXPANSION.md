# Expansión del Sistema de Asientos Contables

## Resumen

Esta expansión del schema de Prisma implementa un sistema completo de asientos contables automatizados que permite:

1. **Definir plantillas de asientos** con condiciones complejas
2. **Generar asientos automáticamente** basados en transacciones, documentos o gastos
3. **Validar el balance contable** (Debe = Haber)
4. **Integrar con el sistema existente** reutilizando modelos y enums

## Nuevos Enums Agregados

### AccountingEntryFilter
- `INVOICES` (FACTURAS): Solo procesa facturas
- `PAYROLL` (RH): Solo procesa recibos por honorarios
- `BOTH` (AMBOS): Procesa ambos tipos

### AccountingEntryCurrency
- `ALL` (TODAS): Aplica a todas las monedas
- `PEN`: Solo soles peruanos
- `USD`: Solo dólares americanos

### MovementType
- `DEBIT` (D): Movimiento al debe
- `CREDIT` (H): Movimiento al haber

### ApplicationType
- `FIXED_AMOUNT`: Monto fijo
- `PERCENTAGE`: Porcentaje sobre una base
- `TRANSACTION_AMOUNT`: Toma el monto total de la transacción

### CalculationBase
- `SUBTOTAL`: Base imponible
- `IGV`: Impuesto general a las ventas
- `TOTAL`: Monto total
- `RENT`: Renta
- `TAX`: Impuestos
- `OTHER`: Otros

## Nuevos Modelos

### 1. AccountingEntryTemplate (Cabecera de Asiento Tipo)

**Propósito**: Define las reglas y condiciones para generar asientos automáticamente.

**Campos principales**:
- `filter`: Tipo de documentos a procesar (FACTURAS, RH - Recibo por Honorarios, AMBOS)
- `currency`: Monedas aplicables (TODAS, PEN, USD)
- `transactionType`: Código de operación ('PAGO_AGUA', 'ALQUILER', etc.)
- `condition`: JSON con reglas complejas

**Ejemplo de condición JSON**:
```json
{
  "descripcion": ["laptop", "dell"],
  "monto_min": 1000,
  "monto_max": 5000,
  "proveedor": ["ABC Tech", "XYZ Computación"]
}
```

### 2. AccountingEntryDetail (Detalle de Asiento Tipo)

**Propósito**: Define las líneas del asiento y cómo calcular los montos.

**Campos principales**:
- `accountCode`: Código de cuenta contable (ej: '1041')
- `movementType`: DEBIT o CREDIT
- `applicationType`: Cómo calcular el monto
- `calculationBase`: Base para el cálculo
- `value`: Valor fijo o porcentaje
- `executionOrder`: Orden de ejecución para cálculos secuenciales

### 3. AccountingEntry (Asiento Contable)

**Propósito**: Representa un asiento contable generado.

**Campos principales**:
- `entryNumber`: Número único del asiento
- `entryDate`: Fecha del asiento
- `totalDebit`: Total del debe
- `totalCredit`: Total del haber
- `isBalanced`: Validación automática (Debe = Haber)
- `status`: Estado (DRAFT, POSTED, CANCELLED)

### 4. AccountingEntryLine (Línea de Asiento)

**Propósito**: Cada línea individual del asiento contable.

**Campos principales**:
- `accountCode`: Código de cuenta
- `movementType`: DEBIT o CREDIT
- `amount`: Monto de la línea
- `auxiliaryCode`: Código auxiliar/anexo
- `costCenterCode`: Centro de costo

## Modificaciones a Modelos Existentes

### BankAccount

Se agregaron dos campos nuevos:
- `accountingAccountId`: Relación con la cuenta contable asociada (CCCB_banco)
- `annexCode`: Código de anexo para identificación adicional

**Relación agregada**:
- `accountingAccount`: Relación opcional con el modelo `AccountingAccount` existente

Estos campos permiten vincular las cuentas bancarias con el plan de cuentas contables.

## Ejemplo Práctico: Compra de Laptop

### Datos de entrada:
- Descripción: "Compra laptop Dell i7 - ABC Tech S.R.L."
- Monto total: $1,180 (incluye IGV)

### Template configurado:
```json
{
  "filter": "INVOICES",
  "currency": "USD",
  "transactionType": "COMPRA_ACTIVO",
  "condition": {
    "descripcion": ["laptop", "dell"],
    "proveedor": ["ABC Tech"]
  }
}
```

### Detalles del template:
1. **Línea 1**: Cuenta 6011 (Gastos), CREDIT, 84.7458% del TOTAL
2. **Línea 2**: Cuenta 4011 (IGV), CREDIT, 18% del SUBTOTAL
3. **Línea 3**: Cuenta 1041 (Banco), DEBIT, MONTO_TRANSACCION

### Cálculos automáticos:
1. SUBTOTAL = $1,180 × 84.7458% = $1,000
2. IGV = $1,000 × 18% = $180
3. BANCO = $1,180

### Asiento resultante:
| Cuenta | Descripción | Debe | Haber |
|--------|-------------|------|-------|
| 1041   | Banco       | $1,180 |       |
| 6011   | Gastos      |        | $1,000 |
| 4011   | IGV         |        | $180  |
| **Total** |           | **$1,180** | **$1,180** |

## Validaciones Implementadas

1. **Balance contable**: `totalDebit` debe ser igual a `totalCredit`
2. **Orden de ejecución**: Los cálculos se ejecutan según `executionOrder`
3. **Integridad referencial**: Todas las relaciones están correctamente definidas
4. **Unicidad**: Los números de asiento son únicos por empresa

## Integración con Sistema Existente

La expansión reutiliza:
- **Enums existentes**: `TransactionType`, `DocumentType`, etc.
- **Modelos existentes**: `Company`, `Document`, `Transaction`, `Expense`, `Conciliation`
- **Patrones de ID**: Mantiene el mismo formato de generación de IDs
- **Estructura de auditoría**: Compatible con `AuditLog`

### Integración con Modelos Existentes

Los nuevos modelos se integran perfectamente con:
- **Company**: Cada plantilla y asiento pertenece a una empresa
- **Document**: Los asientos pueden generarse automáticamente desde documentos
- **Transaction**: Los asientos pueden generarse desde transacciones bancarias
- **Expense**: Los asientos pueden generarse desde gastos registrados
- **Conciliation**: Los asientos pueden generarse desde procesos de conciliación bancaria

## Beneficios

1. **Automatización**: Reduce errores manuales en la contabilidad
2. **Flexibilidad**: Condiciones JSON permiten reglas complejas
3. **Trazabilidad**: Cada asiento está vinculado a su documento/transacción origen
4. **Escalabilidad**: Fácil agregar nuevos tipos de asientos
5. **Validación**: Garantiza el balance contable automáticamente

Esta expansión proporciona una base sólida para automatizar la generación de asientos contables manteniendo la flexibilidad y integridad del sistema existente.