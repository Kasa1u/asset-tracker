// src/db.ts
import Database from "@tauri-apps/plugin-sql";

export async function initDatabase() {
  try {
    // 加上 sqlite: 前缀
    const db = await Database.load("sqlite:assets.db");
    console.log("SQL 插件加载成功！");
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        buy_price REAL NOT NULL,
        buy_date TEXT NOT NULL,
        status INTEGER DEFAULT 0,
        sell_price REAL,
        sell_date TEXT,
        warranty_date TEXT,
        image_path TEXT,
        remark TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        expected_price REAL,
        priority INTEGER DEFAULT 0,
        remark TEXT,
        created_at TEXT NOT NULL
      );
    `);
    
    return db;
  } catch (err) {
    // ✨ 这里会弹出真正的权限报错
    alert("Database.load 失败详情: " + err);
    throw err;
  }
}
