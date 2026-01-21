export const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
  'Activewear',
  'Sleepwear',
  'Other',
] as const;

export const COLORS = [
  'Black',
  'White',
  'Gray',
  'Navy',
  'Blue',
  'Red',
  'Pink',
  'Green',
  'Yellow',
  'Orange',
  'Purple',
  'Brown',
  'Beige',
  'Multi',
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Color = (typeof COLORS)[number];
