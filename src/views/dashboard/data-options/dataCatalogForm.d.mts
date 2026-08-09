import type { DataTypeOptionCreateDTO, DataTypeOptionUpdateDTO, LocalizedText } from '@/types/data-type-option'
import type { DataUnitDefinitionCreateDTO, DataUnitDefinitionUpdateDTO } from '@/types/data-unit-definition'

export type DataTypeForm = DataTypeOptionCreateDTO & { id?: number }
export type DataUnitForm = DataUnitDefinitionCreateDTO & { id?: number }

export function createEmptyDataTypeForm(): DataTypeForm
export function cloneDataTypeForm(form: DataTypeForm): DataTypeForm
export function createLatestRequestGate(): {
  begin(): number
  invalidate(): void
  isLatest(token: number): boolean
}
export function normalizeDataTypePayload(form: Partial<DataTypeForm>): DataTypeOptionCreateDTO | DataTypeOptionUpdateDTO
export function validateLocalizedText(value: Partial<LocalizedText> | null | undefined, path: string): string | null
export function validateDataTypeForm(form: Partial<DataTypeForm>): string | null
/**
 * Accepts untrusted form input, trims keys without changing case, and lowercases only aliases.
 * @throws Error with the exact API field-path message when the input shape or value is invalid.
 */
export function normalizeUnitPayload(form: unknown): DataUnitDefinitionCreateDTO | DataUnitDefinitionUpdateDTO
/** Enforces input shape and API rules, returning the exact API field-path message on failure. */
export function validateUnitForm(form: unknown): string | null
/** Returns a deterministic conflict for valid unit input regardless of unit, variant, or alias order. */
export function validateCatalogAliasOwnership(form: unknown): string | null
