import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  listUsers,
  getUserDetails,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  getAdminAuditLog,
  logUserActivity,
} from "../_core/adminManagement";

export const adminUserRouter = router({
  listUsers: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      role: z.enum(["admin", "user"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const users = await listUsers(input.page, input.limit, {
        role: input.role,
        search: input.search,
      });
      return users;
    }),

  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      const user = await getUserDetails(input.userId);
      return user;
    }),

  updateUserRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["admin", "user"]),
    }))
    .mutation(async ({ input, ctx }) => {
      await updateUserRole(ctx.user.id, input.userId, input.role);
      await logUserActivity(ctx.user.id, "UPDATE_ROLE", "user", input.userId);
      return { success: true, message: "User role updated" };
    }),

  resetUserPassword: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const result = await resetUserPassword(ctx.user.id, input.userId);
      await logUserActivity(ctx.user.id, "RESET_PASSWORD", "user", input.userId);
      return result;
    }),

  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteUser(ctx.user.id, input.userId);
      await logUserActivity(ctx.user.id, "DELETE_USER", "user", input.userId);
      return { success: true, message: "User deleted" };
    }),

  getAuditLog: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      const logs = await getAdminAuditLog(input.page, input.limit);
      return logs;
    }),

  getLoginHistory: protectedProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      return {
        userId: input.userId,
        logins: [],
        message: "Login history not yet implemented",
      };
    }),
});
