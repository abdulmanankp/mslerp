import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sqlPath = path.resolve(projectRoot, "sql", "universities_pakistan_seed.sql");

function parseInsertRows(sqlContent) {
  const rows = [];
  const blockRegex = /insert\s+into\s+public\.universities\s*\([^)]*\)\s*values\s*([\s\S]*?)\s*on\s+conflict\s*\(name\)\s*do\s+nothing\s*;/gi;

  const tupleRegex = /\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*\)/g;

  let blockMatch;
  while ((blockMatch = blockRegex.exec(sqlContent)) !== null) {
    const valuesPart = blockMatch[1];

    let tupleMatch;
    while ((tupleMatch = tupleRegex.exec(valuesPart)) !== null) {
      const name = tupleMatch[1].replace(/''/g, "'").trim();
      const province = tupleMatch[2].replace(/''/g, "'").trim();
      const city = tupleMatch[3].replace(/''/g, "'").trim();
      const sector = tupleMatch[4].replace(/''/g, "'").trim();
      const status = tupleMatch[5].replace(/''/g, "'").trim();

      rows.push({ name, province, city, sector, status });
    }
  }

  return rows;
}

function loadServiceAccountFromEnv() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (json) {
    return JSON.parse(json);
  }

  if (filePath) {
    return fs.readFile(filePath, "utf8").then((content) => JSON.parse(content));
  }

  throw new Error(
    "Missing credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH before running seed.",
  );
}

async function main() {
  const sqlContent = await fs.readFile(sqlPath, "utf8");
  const universities = parseInsertRows(sqlContent);

  if (!universities.length) {
    throw new Error("No universities found in SQL seed file.");
  }

  const serviceAccount = await loadServiceAccountFromEnv();

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const db = getFirestore();
  const universitiesCollection = db.collection("universities");

  let inserted = 0;
  let skipped = 0;

  for (const university of universities) {
    const existingSnapshot = await universitiesCollection.where("name", "==", university.name).limit(1).get();

    if (!existingSnapshot.empty) {
      skipped += 1;
      continue;
    }

    const newRef = universitiesCollection.doc();
    const payload = {
      id: newRef.id,
      name: university.name,
      province: university.province,
      city: university.city,
      sector: university.sector === "Private" ? "Private" : "Public",
      status: university.status === "Inactive" ? "Inactive" : "Active",
      createdDate: new Date().toISOString().slice(0, 10),
    };

    await newRef.set(payload);
    inserted += 1;
  }

  console.log(`Processed ${universities.length} rows.`);
  console.log(`Inserted ${inserted} universities.`);
  console.log(`Skipped ${skipped} existing universities (matched by name).`);
}

main().catch((error) => {
  console.error("Firebase universities seed failed:");
  console.error(error);
  process.exitCode = 1;
});
