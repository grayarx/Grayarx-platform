import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { isFounderEmail } from "../../shared/founderAccess";
import { promoteUserToFounder } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function applyFounderAccess(user: User | null): Promise<User | null> {
  if (!user?.email) return user;
  if (user.role === "founder" || user.role === "admin") return user;
  if (!isFounderEmail(user.email)) return user;
  try {
    return await promoteUserToFounder(user.id);
  } catch (e) {
    console.warn("[auth] founder promote failed:", e);
    return user;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    user = await applyFounderAccess(user);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
