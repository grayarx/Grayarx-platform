import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const multiLocationRouter = router({
  // Get all dealerships for user
  getUserDealerships: protectedProcedure.query(({ ctx }) => {
    return {
      dealerships: [
        {
          id: 1,
          name: "GrayArx Downtown",
          location: "Johannesburg CBD",
          address: "123 Main St, Johannesburg",
          phone: "+27 11 123 4567",
          email: "downtown@grayarx.co.za",
          manager: "John Smith",
          vehicles: 45,
          staff: 12,
          status: "active",
        },
        {
          id: 2,
          name: "GrayArx North",
          location: "Sandton",
          address: "456 Park Ave, Sandton",
          phone: "+27 11 234 5678",
          email: "north@grayarx.co.za",
          manager: "Jane Doe",
          vehicles: 38,
          staff: 10,
          status: "active",
        },
        {
          id: 3,
          name: "GrayArx East",
          location: "Pretoria",
          address: "789 East Rd, Pretoria",
          phone: "+27 12 345 6789",
          email: "east@grayarx.co.za",
          manager: "Bob Johnson",
          vehicles: 32,
          staff: 8,
          status: "active",
        },
      ],
    };
  }),

  // Get dealership details
  getDealershipDetails: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        details: {
          name: "GrayArx Downtown",
          location: "Johannesburg CBD",
          address: "123 Main St, Johannesburg",
          phone: "+27 11 123 4567",
          email: "downtown@grayarx.co.za",
          businessHours: { open: "08:00", close: "18:00" },
          manager: "John Smith",
          vehicles: 45,
          staff: 12,
          monthlyRevenue: 450000,
          monthlyLeads: 120,
          conversionRate: 13.2,
        },
      };
    }),

  // Create new dealership
  createDealership: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        location: z.string(),
        address: z.string(),
        phone: z.string(),
        email: z.string(),
        managerId: z.number(),
        businessHours: z.object({ open: z.string(), close: z.string() }),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        dealershipId: Math.random(),
        name: input.name,
        created: true,
      };
    }),

  // Update dealership
  updateDealership: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        businessHours: z.object({ open: z.string(), close: z.string() }).optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        dealershipId: input.dealershipId,
        updated: true,
      };
    }),

  // Get dealership staff
  getDealershipStaff: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        staff: [
          { id: 1, name: "John Smith", role: "Manager", email: "john@grayarx.co.za", phone: "+27 11 111 1111" },
          { id: 2, name: "Jane Doe", role: "Sales Rep", email: "jane@grayarx.co.za", phone: "+27 11 222 2222" },
          { id: 3, name: "Bob Johnson", role: "Service Manager", email: "bob@grayarx.co.za", phone: "+27 11 333 3333" },
        ],
      };
    }),

  // Add staff to dealership
  addStaffToDealership: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        userId: z.number(),
        role: z.enum(["manager", "sales_rep", "service_manager", "admin"]),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        dealershipId: input.dealershipId,
        userId: input.userId,
        role: input.role,
        added: true,
      };
    }),

  // Get cross-location analytics
  getCrossLocationAnalytics: protectedProcedure.query(() => {
    return {
      summary: {
        totalLocations: 3,
        totalVehicles: 115,
        totalStaff: 30,
        totalMonthlyRevenue: 1350000,
        totalMonthlyLeads: 342,
        averageConversionRate: 13.2,
        topLocation: "GrayArx Downtown",
        topPerformer: "John Smith",
      },
      locationComparison: [
        { location: "Downtown", vehicles: 45, revenue: 450000, leads: 120, conversion: 13.5 },
        { location: "North", vehicles: 38, revenue: 400000, leads: 110, conversion: 13.0 },
        { location: "East", vehicles: 32, revenue: 350000, leads: 90, conversion: 12.8 },
      ],
    };
  }),

  // Sync data across locations
  syncDataAcrossLocations: protectedProcedure
    .input(
      z.object({
        sourceLocationId: z.number(),
        targetLocationIds: z.array(z.number()),
        dataType: z.enum(["templates", "settings", "inventory", "all"]),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        sourceLocation: input.sourceLocationId,
        targetLocations: input.targetLocationIds,
        dataType: input.dataType,
        synced: true,
      };
    }),

  // Get location-specific reports
  getLocationReport: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        report: {
          sales: 45,
          revenue: 1350000,
          leads: 120,
          conversion: 13.5,
          topSalesRep: "Jane Doe",
          topVehicle: "BMW 3 Series",
          customerSatisfaction: 4.7,
        },
      };
    }),

  // Manage dealership permissions
  updateLocationPermissions: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        userId: z.number(),
        permissions: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        dealershipId: input.dealershipId,
        userId: input.userId,
        permissionsUpdated: true,
      };
    }),

  // Get shared resources
  getSharedResources: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        resources: {
          templates: 12,
          documentTemplates: 6,
          emailTemplates: 8,
          smsTemplates: 5,
          reportTemplates: 5,
        },
      };
    }),

  // Consolidate inventory across locations
  consolidateInventory: protectedProcedure
    .input(z.object({ dealershipIds: z.array(z.number()) }))
    .query(({ input }) => {
      return {
        locations: input.dealershipIds,
        consolidatedInventory: {
          totalVehicles: 115,
          byMake: [
            { make: "BMW", count: 35 },
            { make: "Mercedes-Benz", count: 28 },
            { make: "Audi", count: 25 },
            { make: "Volkswagen", count: 27 },
          ],
          averagePrice: 74000,
          totalValue: 8510000,
        },
      };
    }),
});
