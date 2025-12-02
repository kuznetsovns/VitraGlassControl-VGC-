import type { Department } from '../../Layout'

export interface ProjectObject {
  id: string
  name: string
  customer: string
  address: string
  buildingsCount: number
  image?: string // Base64 image data
  createdAt: Date
  updatedAt: Date
}

export interface MainPageProps {
  onDepartmentSelect?: (department: Department, objectId: string, objectName: string) => void
}

export interface ObjectFormData {
  name: string
  customer: string
  address: string
  buildingsCount: number
}
