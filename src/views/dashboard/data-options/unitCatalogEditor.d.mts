import type { DataUnitDefinitionCreateDTO, DataUnitDefinitionVO } from '@/types/data-unit-definition'

export type UnitForm = DataUnitDefinitionCreateDTO & { id?: number }
export function createEmptyUnitForm(): UnitForm
export function cloneUnitForm(unit: DataUnitDefinitionVO): UnitForm
export function renameVariant(form: UnitForm, oldKey: string, newKey: string): string | null
export function deleteVariant(form: UnitForm, key: string): string | null
export function addVariant(form: UnitForm): void
export function replaceUnitForm(target: object, source: object): void
