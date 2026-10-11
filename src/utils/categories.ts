import { GroceryCategory } from '../types';

export interface CategoryInfo {
  name: GroceryCategory;
  icon: string;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { name: 'Produce', icon: 'nutrition', color: '#16a34a', bgColor: '#dcfce7' },
  { name: 'Dairy & Refrigerated', icon: 'water', color: '#0284c7', bgColor: '#e0f2fe' },
  { name: 'Bakery', icon: 'pizza', color: '#d97706', bgColor: '#fef3c7' },
  { name: 'Meat & Seafood', icon: 'restaurant', color: '#dc2626', bgColor: '#fee2e2' },
  { name: 'Pantry & Canned', icon: 'cube', color: '#9333ea', bgColor: '#f3e8ff' },
  { name: 'Frozen', icon: 'snow', color: '#2563eb', bgColor: '#dbeafe' },
  { name: 'Beverages', icon: 'wine', color: '#0891b2', bgColor: '#cffafe' },
  { name: 'Snacks', icon: 'happy', color: '#ea580c', bgColor: '#ffedd5' },
  { name: 'Household', icon: 'home', color: '#4b5563', bgColor: '#f3f4f6' },
  { name: 'Other', icon: 'cart', color: '#64748b', bgColor: '#f1f5f9' },
];

export function getCategoryInfo(category: GroceryCategory): CategoryInfo {
  const match = CATEGORIES.find(c => c.name === category);
  return match || CATEGORIES[CATEGORIES.length - 1];
}

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  Produce: ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'onion', 'garlic', 'potato', 'avocado', 'lemon', 'lime', 'berry', 'spinach', 'kale', 'carrot', 'broccoli', 'cucumber', 'pepper', 'herb', 'cilantro', 'fruit', 'vegetable'],
  'Dairy & Refrigerated': ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'egg', 'eggs', 'sour cream', 'cheddar', 'mozzarella', 'parmesan', 'almond milk', 'oat milk'],
  Bakery: ['bread', 'bagel', 'croissant', 'tortilla', 'bun', 'buns', 'muffin', 'cake', 'cookie', 'pita', 'roll', 'rolls', 'pastry'],
  'Meat & Seafood': ['chicken', 'beef', 'steak', 'pork', 'bacon', 'salmon', 'fish', 'shrimp', 'turkey', 'sausage', 'tuna', 'ground beef'],
  'Pantry & Canned': ['rice', 'pasta', 'sauce', 'olive oil', 'oil', 'flour', 'sugar', 'beans', 'soup', 'cereal', 'oats', 'salt', 'pepper', 'spice', 'vinegar', 'peanut butter', 'honey'],
  Frozen: ['ice cream', 'frozen', 'pizza', 'peas', 'waffles', 'popsicles', 'fries'],
  Beverages: ['water', 'coffee', 'tea', 'juice', 'soda', 'coke', 'beer', 'wine', 'sparkling water', 'seltzer', 'kombucha'],
  Snacks: ['chips', 'cracker', 'popcorn', 'pretzels', 'nuts', 'chocolate', 'candy', 'bar', 'granola bar'],
  Household: ['paper towel', 'toilet paper', 'soap', 'detergent', 'sponge', 'trash bags', 'cleaner', 'shampoo', 'toothpaste', 'foil', 'ziploc'],
  Other: [],
};

export function autoDetectCategory(itemName: string): GroceryCategory {
  const lower = itemName.trim().toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category as GroceryCategory;
    }
  }
  return 'Produce';
}
