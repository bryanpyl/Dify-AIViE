export type Tag = {
  id: string
  name: string
  type: string
  created_by_name: String
  binding_count: number
}

export type TagBinding = {
  target_id: string
}
