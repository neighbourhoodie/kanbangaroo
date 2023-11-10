
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

export type Lock = {
  type: 'lock'
  _id: string
  locks: string    // `_id` of the target document
  lockedBy: string // username (`_id` in a real app)
  lockedAt: string // ISO datetime string
}

export type OnlineUser = {
  type: 'onlineUser'
  _id: string
  active: boolean
  name: string
  color: string
}

export type AnyDoc = Card | Column | ActivityLog | Lock | OnlineUser

export type ConflictData = {
  base: PouchDB.Core.PostDocument<Card>,
  mine: PouchDB.Core.PostDocument<Card>,
  theirs?: PouchDB.Core.PostDocument<Card>
}
