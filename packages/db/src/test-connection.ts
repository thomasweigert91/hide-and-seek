import { db, users } from "./index";

async function testConnection() {
  console.log("🔄 Teste Verbindung zu Supabase...");
  try {
    // 1. Einfache Abfrage auf die users-Tabelle
    const result = await db.select().from(users);
    console.log("✅ Verbindung erfolgreich hergestellt!");
    console.log(`📊 Gefundene Einträge in 'users': ${result.length}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Fehler bei der Datenbankverbindung:", error);
    process.exit(1);
  }
}

void testConnection();
