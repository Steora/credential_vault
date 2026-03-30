/**
 * prisma/seed.ts
 *
 * Creates one user of each role and one sample project with a secret and a note.
 * Run with:  npx tsx prisma/seed.ts
 */

import "dotenv/config";
import { PrismaClient, Role, NoteType } from "@prisma/client";
import { VAULT_ENTITY_STATUS } from "../lib/vault-entity-status";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { createCipheriv, randomBytes } from "crypto";

// ---------------------------------------------------------------------------
// Bootstrap a bare PrismaClient (no extensions needed for seeding)
// ---------------------------------------------------------------------------
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Inline encrypt helper (mirrors lib/crypto.ts without importing it)
// ---------------------------------------------------------------------------
function encryptValue(text: string): { encryptedValue: string; iv: string } {
  const key    = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const ivBuf  = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, ivBuf);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag   = cipher.getAuthTag();

  return {
    encryptedValue: Buffer.concat([encrypted, authTag]).toString("hex"),
    iv:             ivBuf.toString("hex"),
  };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const USERS = [
  { name: "Super Admin",  email: "superadmin@vault.dev", password: "Password1!", role: Role.SUPERADMIN },
  { name: "Admin User",   email: "admin@vault.dev",      password: "Password1!", role: Role.ADMIN      },
  { name: "Moderator",    email: "moderator@vault.dev",  password: "Password1!", role: Role.MODERATOR  },
  { name: "Regular User", email: "user@vault.dev",       password: "Password1!", role: Role.USER       },
  { name: "Intern",       email: "intern@vault.dev",     password: "Password1!", role: Role.INTERN     },
];

async function main() {
  console.log("🌱  Seeding database…\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const createdUsers: Record<string, string> = {};

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
    createdUsers[u.role] = user.id;
    console.log(`  ✔ ${u.role.padEnd(11)} ${u.email}  (password: ${u.password})`);
  }

  // ── Project ────────────────────────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where:  { name: "Demo Project" },
    update: { parentId: null, status: VAULT_ENTITY_STATUS.ACTIVE },
    create: {
      name:        "Demo Project",
      description: "Sample project created by the seed script.",
      status:      VAULT_ENTITY_STATUS.ACTIVE,
    },
  });
  console.log(`\n  ✔ Project       "${project.name}" (id: ${project.id})`);

  const SUBPROJECTS = [
    { name: "Demo — API",    description: "API subproject (secrets & access can be scoped here)." },
    { name: "Demo — Web",    description: "Web subproject." },
    { name: "Demo — Mobile", description: "Mobile subproject." },
    { name: "Demo — Infra",  description: "Infrastructure subproject." },
  ] as const;

  const subByName: Record<string, { id: string; name: string }> = {};
  for (const sp of SUBPROJECTS) {
    const row = await prisma.project.upsert({
      where:  { name: sp.name },
      update: { parentId: project.id, status: VAULT_ENTITY_STATUS.ACTIVE },
      create: {
        name:        sp.name,
        description: sp.description,
        parentId:    project.id,
        status:      VAULT_ENTITY_STATUS.ACTIVE,
      },
      select: { id: true, name: true },
    });
    subByName[sp.name] = row;
    console.log(`  ✔ Subproject    "${row.name}" (under Demo Project)`);
  }

  const demoApi = subByName["Demo — API"]!;

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId:    createdUsers[Role.USER],
        projectId: demoApi.id,
      },
    },
    update: {},
    create: { userId: createdUsers[Role.USER], projectId: demoApi.id },
  });
  console.log(`  ✔ Membership    USER ↔ "${demoApi.name}" (subproject access for testing)`);

  // ── Secret ────────────────────────────────────────────────────────────────
  const { encryptedValue, iv } = encryptValue("postgres://user:pass@localhost/demo");

  const secret = await prisma.secret.upsert({
    where:  { id: "seed-secret-001" },
    update: { projectId: demoApi.id },
    create: {
      id:             "seed-secret-001",
      key:            "DATABASE_URL",
      encryptedValue,
      iv,
      projectId:      demoApi.id,
      ownerId:        createdUsers[Role.SUPERADMIN],
      // Share with the regular user so they can test sharedWith access
      sharedWith:     { connect: { id: createdUsers[Role.USER] } },
    },
  });
  console.log(`  ✔ Secret        "${secret.key}" on "${demoApi.name}" (shared with USER)`);

  // ── Note ──────────────────────────────────────────────────────────────────
  const note = await prisma.note.upsert({
    where:  { id: "seed-note-001" },
    update: { status: VAULT_ENTITY_STATUS.ACTIVE },
    create: {
      id:        "seed-note-001",
      title:     "Getting Started",
      content:   "This note was created by the seed script. Moderators and above can edit it.",
      type:      NoteType.PROJECT_BASED,
      projectId: project.id,
      ownerId:   createdUsers[Role.SUPERADMIN],
      status:    VAULT_ENTITY_STATUS.ACTIVE,
    },
  });
  console.log(`  ✔ Note          "${note.title}"`);

  console.log("\n✅  Seed complete.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
