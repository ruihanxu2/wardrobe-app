export interface ClothingItem {
  id: string;
  user_id: string;
  image_url: string;
  name: string;
  category: string;
  color: string;
  occasion: string[] | null;
  brand: string | null;
  notes: string | null;
  created_at: string;
}

export type ClothingItemInsert = Omit<ClothingItem, 'id' | 'created_at'>;
export type ClothingItemUpdate = Partial<Omit<ClothingItem, 'id' | 'user_id' | 'created_at'>>;
