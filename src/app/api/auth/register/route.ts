import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/validations/auth";
import { slugify } from "@/lib/utils";
import { ok, route } from "@/server/http";
import { AppError } from "@/server/errors";

/**
 * POST /api/auth/register
 * Creates a user, a personal default workspace, and the owner membership.
 */
export const POST = route(async (req: Request) => {
  const body = await req.json();
  const { name, email, password } = registerSchema.parse(body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email is already registered", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          workspace: {
            create: {
              name: `${name.split(" ")[0]}'s Workspace`,
              slug: `${slugify(name)}-${Date.now().toString(36)}`,
            },
          },
        },
      },
    },
    select: { id: true, name: true, email: true },
  });

  return ok(user, { status: 201 });
});
