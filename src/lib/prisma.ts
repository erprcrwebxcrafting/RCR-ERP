import { PrismaClient } from "@prisma/client";
import { revalidateTag } from "next/cache";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const result = await query(args);
          if (
            ["create", "createMany", "update", "updateMany", "delete", "deleteMany", "upsert"].includes(
              operation
            )
          ) {
            try {
              revalidateTag("reports-data");
            } catch (error) {
              // Ignore if called outside of a Next.js request context
            }
          }
          return result;
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
