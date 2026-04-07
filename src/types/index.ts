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
  image_path?: string | null;
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
  0: "#3b6fd4",
  1: "#3da871",
  2: "#8c9fc7",
  3: "#d4933b",
  4: "#e05c5c"
};