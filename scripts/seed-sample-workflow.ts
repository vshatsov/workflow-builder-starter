
import { db } from "../lib/db";
import { users, workflows } from "../lib/db/schema";
import { generateId } from "../lib/utils/id";
import { eq } from "drizzle-orm";
import exampleWorkflow from "../example-workflow.json";

async function main() {
  console.log("Seeding sample workflow...");

  const email = process.argv[2] || "demo@example.com";
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.log(`User ${email} not found. Creating demo user...`);
    const [newUser] = await db.insert(users).values({
      id: generateId(),
      email,
      name: "Demo User",
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
    }).returning();
    user = newUser;
  }

  console.log(`Using user: ${user.id} (${user.email})`);

  // Check if workflow already exists
  const existingWorkflows = await db.query.workflows.findMany({
    where: eq(workflows.userId, user.id),
  });

  if (existingWorkflows.length > 0) {
    console.log("Workflows already exist. Skipping seed.");
    process.exit(0);
  }

  const [workflow] = await db.insert(workflows).values({
    id: generateId(),
    name: "Hello Workflow",
    description: "Trigger → Log",
    userId: user.id,
    nodes: exampleWorkflow.nodes,
    edges: exampleWorkflow.edges,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  console.log(`Seeded workflow: ${workflow.id}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});







