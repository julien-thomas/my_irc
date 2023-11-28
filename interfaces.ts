export interface User {
  name: string,
  socket: string,
  room_id: number
}

export interface Room {
  users: User[],
  messages: Message[],
  room_id: number
}

export interface Message {
  sender: string | undefined,
  room_id: number | undefined,
  content: string
}