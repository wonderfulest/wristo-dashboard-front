import type { DataTypeOptionCreateDTO, DataTypeOptionUpdateDTO, LocalizedText } from '@/types/data-type-option'
import type { DataUnitDefinitionCreateDTO, DataUnitDefinitionUpdateDTO } from '@/types/data-unit-definition'

export type DataTypeForm = DataTypeOptionCreateDTO & { id?: number }
export type DataUnitForm = DataUnitDefinitionCreateDTO & { id?: number }

export function createEmptyDataTypeForm(): DataTypeForm
export function normalizeDataTypePayload(form: Partial<DataTypeForm>): DataTypeOptionCreateDTO | DataTypeOptionUpdateDTO
export function validateLocalizedText(value: Partial<LocalizedText> | null | undefined, path: string): string | null
export function validateDataTypeForm(form: Partial<DataTypeForm>): string | null
/** Trims unit and variant keys without changing case; only aliases are lowercased. */
export function normalizeUnitPayload(form: Partial<DataUnitForm>): DataUnitDefinitionCreateDTO | DataUnitDefinitionUpdateDTO
/** Enforces the API key pattern after trimming and returns the API field path on failure. */
export function validateUnitForm(form: Partial<DataUnitForm> | Partial<DataUnitForm>[]): string | null
