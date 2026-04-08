import { PrismaClient, UserRole } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const users = [
    {
      email: "admin@hr-interview.ai",
      password: "Admin123!",
      firstName: "Admin",
      lastName: "System",
      role: UserRole.ADMIN,
    },
    {
      email: "recruiter@hr-interview.ai",
      password: "Recruiter123!",
      firstName: "Nguyen",
      lastName: "Recruiter",
      role: UserRole.RECRUITER,
      company: "HR Interview AI",
    },
    {
      email: "candidate@hr-interview.ai",
      password: "Candidate123!",
      firstName: "Tran",
      lastName: "Candidate",
      role: UserRole.CANDIDATE,
    },
  ];

  for (const userData of users) {
    const { password, ...rest } = userData;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email: rest.email },
      update: {},
      create: {
        ...rest,
        passwordHash,
        isActive: true,
      },
    });

    console.log(`  - ${user.role}: ${user.email} (id: ${user.id})`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
