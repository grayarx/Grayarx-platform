import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { autoRepairCSV } from '../_core/csvAutoRepair';

export const csvAutoRepairRouter = router({
  /**
   * Auto-repair and analyze CSV file
   * Takes ANY CSV format and returns clean, mapped data
   */
  autoRepairCSV: protectedProcedure
    .input(
      z.object({
        csvText: z.string().min(1, 'CSV content is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = autoRepairCSV(input.csvText);

        // Log the import for audit trail
        console.log(`[CSV Import] User ${ctx.user.id} imported ${result.rows.length} records`, {
          confidence: result.report.confidence,
          issues: result.report.issuesFound.length,
          warnings: result.report.warnings.length,
        });

        return {
          success: true,
          data: result,
          message: `Successfully processed ${result.rows.length} records`,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[CSV Import Error]', message);
        throw new Error(`Failed to process CSV: ${message}`);
      }
    }),

  /**
   * Preview CSV repair without importing
   * Useful for showing users what will happen
   */
  previewRepair: protectedProcedure
    .input(
      z.object({
        csvText: z.string().min(1, 'CSV content is required'),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = autoRepairCSV(input.csvText);
        return {
          success: true,
          preview: {
            originalRows: result.report.originalRows,
            repairedRows: result.report.repairedRows,
            confidence: result.report.confidence,
            issues: result.report.issuesFound,
            warnings: result.report.warnings,
            sampleData: result.rows.slice(0, 3),
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to preview CSV: ${message}`);
      }
    }),

  /**
   * Get CSV template for dealerships to use
   */
  getTemplate: publicProcedure.query(async () => {
    const template = `leadId,customerName,email,phone,vehicleInterest,budget,tradeIn,testDrive,source,status,createdAt,converted
L001,John Smith,john@example.com,555-0123,Toyota Camry,25000,Yes,2026-06-15,Website,Active,2026-05-29,Yes
L002,Jane Doe,jane@example.com,555-0456,Honda Accord,35000,No,2026-06-20,Referral,Qualified,2026-05-28,No
L003,Bob Johnson,bob@example.com,555-0789,Ford F-150,45000,Yes,2026-06-10,Phone,Active,2026-05-27,Yes`;

    return {
      template,
      description: 'CSV template with recommended columns. You can add/remove columns as needed.',
      note: 'GrayArx will automatically detect and repair your data - this is just a guide!',
    };
  }),
});
