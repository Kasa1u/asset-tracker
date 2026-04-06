export interface Asset {
  id: number;
  name: string;
  buy_price: number;
  buy_date: string;
  warranty_date: string | null;
  category: string;
  status: number;
  sell_price?: number | null;
  sell_date?: string | null;
  remark?: string | null;
  created_at?: string;
  dailyCost?: number;
}

export interface WishlistItem {
  id: number;
  name: string;
  category: string;
  expected_price: number;
  priority: number;
  remark?: string | null;
  created_at?: string;
}

export type Locale = "zh" | "en";

export const STATUS_MAP: Record<number, string> = {
  0: "保障中",
  1: "活跃中",
  2: "已退役",
  3: "已用完",
  4: "已售出"
};

export const STATUS_COLOR_MAP: Record<number, string> = {
  0: "#2080f0",
  1: "#18a058",
  2: "#909399",
  3: "#f0a020",
  4: "#d03050"
};
