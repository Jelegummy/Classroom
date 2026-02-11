export type BuyItems = {
  userId: string
  itemId: string
  amount: number
}

export type Items = {
  id: string
  name: string
  description?: string
  price: number
  effectValue?: number
  type: 'ATTACK_BOOST' | 'TIME_EXTEND'
}
