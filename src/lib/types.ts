
export type Card = {
  type: "card"
  column: string
  position: number
  _id: string
  title: string
  createdBy: string
  createdAt: string
}

export type Column = {
  type: "column"
  _id: string
  position: number
  label: string
}

export type NewCard = {
  type: "newCard"
  title: ""
  column: string
  createdBy: string
  createdAt: string
}

export type ActivityLog = {
  type: "activityLog"
  _id: string
  updatedBy: string
  updatedAt: string
}

export type AnyDoc = Card | Column | ActivityLog
