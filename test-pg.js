const { Client } = require('pg');

const url = "postgresql://neondb_owner:npg_6RIczVqjX1gO@ep-quiet-dream-ayndk0uf-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

const client = new Client({
  connectionString: url,
});

async function main() {
  try {
    await client.connect();
    const res = await client.query('SELECT $1::text as message', ['Hello world!']);
    console.log("PG Connection successful:", res.rows[0].message);
  } catch (err) {
    console.error("PG Connection failed:", err.message, err);
  } finally {
    await client.end();
  }
}

main();
