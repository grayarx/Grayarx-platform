import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const serviceAppointmentRouter = router({
  // Get available time slots
  getAvailableSlots: protectedProcedure
    .input(
      z.object({
        dealershipId: z.number(),
        date: z.date(),
        serviceType: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        date: input.date,
        serviceType: input.serviceType,
        availableSlots: [
          { time: "09:00 AM", duration: "30 minutes", technician: "John Smith" },
          { time: "09:30 AM", duration: "30 minutes", technician: "Jane Doe" },
          { time: "10:00 AM", duration: "30 minutes", technician: "John Smith" },
          { time: "02:00 PM", duration: "30 minutes", technician: "Bob Johnson" },
          { time: "02:30 PM", duration: "30 minutes", technician: "Jane Doe" },
          { time: "03:00 PM", duration: "30 minutes", technician: "Bob Johnson" },
        ],
      };
    }),

  // Get technician availability
  getTechnicianAvailability: protectedProcedure
    .input(z.object({ dealershipId: z.number(), days: z.number().default(30) }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        technicians: [
          {
            id: 1,
            name: "John Smith",
            specialization: ["Oil Change", "Tire Service", "General Maintenance"],
            availability: "Mon-Fri 8AM-5PM",
            currentLoad: 6,
            maxCapacity: 8,
          },
          {
            id: 2,
            name: "Jane Doe",
            specialization: ["Brake Service", "Suspension", "Electrical"],
            availability: "Mon-Sat 8AM-6PM",
            currentLoad: 7,
            maxCapacity: 8,
          },
          {
            id: 3,
            name: "Bob Johnson",
            specialization: ["Engine Repair", "Transmission", "Diagnostics"],
            availability: "Mon-Fri 9AM-6PM",
            currentLoad: 5,
            maxCapacity: 8,
          },
        ],
      };
    }),

  // Book service appointment
  bookAppointment: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        dealershipId: z.number(),
        vehicleId: z.number(),
        serviceType: z.string(),
        date: z.date(),
        time: z.string(),
        technicianId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        appointmentId: Math.random(),
        customerId: input.customerId,
        date: input.date,
        time: input.time,
        confirmationNumber: `APT-${Date.now()}`,
        reminderSent: true,
      };
    }),

  // Get customer appointments
  getCustomerAppointments: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        dealershipId: z.number(),
        status: z.enum(["upcoming", "completed", "cancelled"]).optional(),
      })
    )
    .query(({ input }) => {
      return {
        customerId: input.customerId,
        appointments: [
          {
            id: 1,
            vehicleId: 1,
            make: "BMW",
            model: "3 Series",
            serviceType: "Oil Change",
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            time: "10:00 AM",
            technician: "John Smith",
            status: "confirmed",
            confirmationNumber: "APT-1234567890",
          },
          {
            id: 2,
            vehicleId: 1,
            make: "BMW",
            model: "3 Series",
            serviceType: "Tire Rotation",
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            time: "02:00 PM",
            technician: "Jane Doe",
            status: "completed",
            completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
        ],
      };
    }),

  // Cancel appointment
  cancelAppointment: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        dealershipId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        appointmentId: input.appointmentId,
        cancelled: true,
        cancellationTime: new Date(),
      };
    }),

  // Reschedule appointment
  rescheduleAppointment: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        dealershipId: z.number(),
        newDate: z.date(),
        newTime: z.string(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        appointmentId: input.appointmentId,
        newDate: input.newDate,
        newTime: input.newTime,
        rescheduled: true,
      };
    }),

  // Get service types
  getServiceTypes: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        serviceTypes: [
          { id: 1, name: "Oil Change", duration: "30 minutes", price: 75 },
          { id: 2, name: "Tire Rotation", duration: "45 minutes", price: 50 },
          { id: 3, name: "Brake Service", duration: "60 minutes", price: 150 },
          { id: 4, name: "Air Filter Replacement", duration: "20 minutes", price: 40 },
          { id: 5, name: "Battery Replacement", duration: "30 minutes", price: 120 },
          { id: 6, name: "Suspension Inspection", duration: "45 minutes", price: 100 },
          { id: 7, name: "Engine Diagnostics", duration: "60 minutes", price: 200 },
          { id: 8, name: "General Inspection", duration: "30 minutes", price: 60 },
        ],
      };
    }),

  // Send appointment reminder
  sendAppointmentReminder: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        dealershipId: z.number(),
        channel: z.enum(["sms", "email"]),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        appointmentId: input.appointmentId,
        channel: input.channel,
        reminderSent: true,
      };
    }),

  // Get appointment statistics
  getAppointmentStats: protectedProcedure
    .input(z.object({ dealershipId: z.number(), days: z.number().default(30) }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        period: `Last ${input.days} days`,
        stats: {
          totalAppointments: 156,
          completedAppointments: 142,
          cancelledAppointments: 8,
          noShowAppointments: 6,
          completionRate: 91,
          averageWaitTime: "2 days",
          mostBookedService: "Oil Change",
          peakBookingDay: "Saturday",
          peakBookingTime: "10:00 AM - 12:00 PM",
        },
      };
    }),

  // Get dealership service hours
  getServiceHours: protectedProcedure
    .input(z.object({ dealershipId: z.number() }))
    .query(({ input }) => {
      return {
        dealershipId: input.dealershipId,
        serviceHours: {
          monday: { open: "8:00 AM", close: "6:00 PM" },
          tuesday: { open: "8:00 AM", close: "6:00 PM" },
          wednesday: { open: "8:00 AM", close: "6:00 PM" },
          thursday: { open: "8:00 AM", close: "6:00 PM" },
          friday: { open: "8:00 AM", close: "6:00 PM" },
          saturday: { open: "9:00 AM", close: "4:00 PM" },
          sunday: { open: "closed", close: "closed" },
        },
      };
    }),

  // Track appointment completion
  completeAppointment: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        dealershipId: z.number(),
        completionNotes: z.string().optional(),
        servicesCompleted: z.array(z.string()).optional(),
        totalCost: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        appointmentId: input.appointmentId,
        completed: true,
        completionTime: new Date(),
      };
    }),
});
