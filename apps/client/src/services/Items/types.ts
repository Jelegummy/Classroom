export type BuyItems = {
  userId: string
  itemId: string
  gameId?: string
  amount: number
}

export type Items = {
  id: string
  name: string
  description?: string
  price: number
  effectValue?: number
  imageUrl?: string
  type: 'ATTACK_BOOST' | 'TIME_EXTEND'
}

export type CreateItemsArgs = {
  name: string
  description?: string
  price: number
  effectValue?: number
  imageUrl?: string
  type: 'ATTACK_BOOST' | 'TIME_EXTEND'
}
