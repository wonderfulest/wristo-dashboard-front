export interface OverviewFilters {
  isDeleted?: number
  status?: number
  roleId?: number
  emailVerified?: boolean
  neverLoggedIn?: boolean
  noRole?: boolean
  registrationSource?: string
  registrationMethod?: string
  createdFrom?: string
  createdBefore?: string
  loginFrom?: string
  loginBefore?: string
}
export const registrationSourceLabels: Record<string, string>
export const registrationMethodLabels: Record<string, string>
export function parseOverviewFilters(query: Record<string, unknown>): OverviewFilters
export function overviewUserRoute(filters: OverviewFilters, label: string): { path: string; query: Record<string, string> }
