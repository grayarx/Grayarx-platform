import { router } from "..//_core/trpc";
/**
 * Email Router - tRPC procedures for email notifications
 */

import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  sendLeadAcknowledgmentEmail,
  sendBookingConfirmationEmail,
  sendTradeInValuationEmail,
  sendDealershipNotificationEmail,
  testEmailDelivery,
} from "../_core/resendEmailService";

export const emailRouter = router({
  /**
   * Send lead acknowledgment email
   */
  sendLeadAcknowledgment: publicProcedure
    .input(
      z.object({
        customerEmail: z.string().email(),
        customerName: z.string(),
        dealershipName: z.string(),
        leadType: z.enum(["trade_in", "finance", "showroom_enquiry"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendLeadAcknowledgmentEmail(
        input.customerEmail,
        input.customerName,
        input.dealershipName,
        input.leadType
      );

      return {
        success: result.success,
        message: result.success ? "Email sent successfully" : result.error,
      };
    }),

  /**
   * Send booking confirmation email
   */
  sendBookingConfirmation: publicProcedure
    .input(
      z.object({
        customerEmail: z.string().email(),
        customerName: z.string(),
        dealershipName: z.string(),
        bookingDetails: z.object({
          vehicleDescription: z.string(),
          testDriveDate: z.string(),
          testDriveTime: z.string(),
          dealershipAddress: z.string(),
          dealershipPhone: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendBookingConfirmationEmail(
        input.customerEmail,
        input.customerName,
        input.dealershipName,
        {
          date: input.bookingDetails.testDriveDate,
          time: input.bookingDetails.testDriveTime,
          vehicleDescription: input.bookingDetails.vehicleDescription,
          location: input.bookingDetails.dealershipAddress,
        }
      );

      return {
        success: result.success,
        message: result.success ? "Email sent successfully" : result.error,
      };
    }),

  /**
   * Send trade-in valuation email
   */
  sendTradeInValuation: publicProcedure
    .input(
      z.object({
        customerEmail: z.string().email(),
        customerName: z.string(),
        dealershipName: z.string(),
        valuationDetails: z.object({
          vehicleDescription: z.string(),
          marketValue: z.number(),
          estimatedTradeInValue: z.number(),
          currency: z.string().default("R"),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendTradeInValuationEmail(
        input.customerEmail,
        input.customerName,
        input.dealershipName,
        {
          vehicleDescription: input.valuationDetails.vehicleDescription,
          marketValue: input.valuationDetails.marketValue,
          estimatedTradeIn: input.valuationDetails.estimatedTradeInValue,
          condition: "Good",
        }
      );

      return {
        success: result.success,
        message: result.success ? "Email sent successfully" : result.error,
      };
    }),

  /**
   * Send dealership notification email
   */
  sendDealershipNotification: protectedProcedure
    .input(
      z.object({
        dealershipEmail: z.string().email(),
        dealershipName: z.string(),
        notificationType: z.enum(["new_lead", "booking", "trade_in"]),
        details: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendDealershipNotificationEmail(
        input.dealershipEmail,
        input.dealershipName,
        input.notificationType,
        input.details
      );

      return {
        success: result.success,
        message: result.success ? "Email sent successfully" : result.error,
      };
    }),

  /**
   * Test email delivery
   */
  testEmailDelivery: publicProcedure
    .input(
      z.object({
        testEmail: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await testEmailDelivery(input.testEmail);

      return {
        success: result.success,
        message: result.success
          ? "Test email sent successfully. Check your inbox."
          : `Email delivery failed: ${result.error}`,
      };
    }),
});
