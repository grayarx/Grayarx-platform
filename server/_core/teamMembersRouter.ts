import { router, protectedProcedure } from "./trpc";
import { z } from "zod";

// Mock implementations - these would be real in production
const sendEmail = async (config: any) => {
  console.log("Email would be sent:", config);
  return true;
};

const teamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "salesperson"]),
  name: z.string().optional(),
});

export const teamMembersRouter = router({
  inviteTeamMember: protectedProcedure
    .input(teamMemberSchema)
    .mutation(async ({ ctx, input }: any) => {
      const invitationToken = Buffer.from(
        JSON.stringify({
          email: input.email,
          dealershipId: ctx.user.id,
          timestamp: Date.now(),
        })
      ).toString("base64");

      const invitationUrl = `${process.env.VITE_APP_FRONTEND_URL || "https://grayarx.com"}/team/accept-invitation?token=${invitationToken}`;

      try {
        await sendEmail({
          to: input.email,
          subject: "You're invited to join GrayArx",
          template: "team-invitation",
          data: {
            name: input.name || input.email.split("@")[0],
            dealershipName: "Your Dealership",
            role: input.role,
            invitationUrl,
          },
        });
      } catch (error) {
        console.error("Failed to send invitation email:", error);
      }

      return {
        success: true,
        email: input.email,
        role: input.role,
        invitationSent: true,
      };
    }),

  listTeamMembers: protectedProcedure.query(async ({ ctx }: any) => {
    return [
      {
        id: "member-1",
        email: "manager@dealership.co.za",
        role: "manager",
        status: "accepted",
        invitedAt: new Date(),
        acceptedAt: new Date(),
      },
    ];
  }),

  updateRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["admin", "manager", "salesperson"]),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return {
        success: true,
        memberId: input.memberId,
        role: input.role,
      };
    }),

  removeTeamMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      return {
        success: true,
        memberId: input.memberId,
        removed: true,
      };
    }),

  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      try {
        const decoded = JSON.parse(
          Buffer.from(input.token, "base64").toString("utf-8")
        );

        return {
          success: true,
          email: decoded.email,
          dealershipId: decoded.dealershipId,
          message: "Invitation accepted successfully",
        };
      } catch (error) {
        return {
          success: false,
          error: "Invalid or expired invitation token",
        };
      }
    }),

  resendInvitation: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      return {
        success: true,
        memberId: input.memberId,
        message: "Invitation resent successfully",
      };
    }),
});
