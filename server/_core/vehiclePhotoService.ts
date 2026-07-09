/**
 * Vehicle Photo Upload and Management Service
 * Handles photo uploads, storage, and display
 */

import { storagePut, storageGet } from "../storage";
import { TRPCError } from "@trpc/server";

export interface VehiclePhoto {
  id: string;
  vehicleId: string;
  url: string;
  fileKey: string;
  filename: string;
  mimeType: string;
  size: number;
  isPrimary: boolean;
  uploadedAt: Date;
  order: number;
}

/**
 * Upload vehicle photo
 */
export async function uploadVehiclePhoto(
  vehicleId: string,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<VehiclePhoto> {
  if (!vehicleId || !fileBuffer || !filename) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Vehicle ID, file, and filename required",
    });
  }

  // Validate file size (max 10MB)
  if (fileBuffer.length > 10 * 1024 * 1024) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File size must be less than 10MB",
    });
  }

  // Validate mime type
  const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validMimeTypes.includes(mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
    });
  }

  try {
    // Upload to S3
    const fileKey = `vehicles/${vehicleId}/photos/${Date.now()}-${filename}`;
    const { url, key } = await storagePut(fileKey, fileBuffer, mimeType);

    return {
      id: `photo-${Date.now()}`,
      vehicleId,
      url,
      fileKey: key,
      filename,
      mimeType,
      size: fileBuffer.length,
      isPrimary: false,
      uploadedAt: new Date(),
      order: 0,
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to upload photo",
    });
  }
}

/**
 * Get vehicle photos
 */
export async function getVehiclePhotos(vehicleId: string): Promise<VehiclePhoto[]> {
  if (!vehicleId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Vehicle ID required",
    });
  }

  // TODO: Query database for vehicle photos
  // For now, return empty array
  return [];
}

/**
 * Get primary vehicle photo
 */
export async function getPrimaryVehiclePhoto(vehicleId: string): Promise<VehiclePhoto | null> {
  if (!vehicleId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Vehicle ID required",
    });
  }

  // TODO: Query database for primary photo
  // For now, return null
  return null;
}

/**
 * Set primary photo
 */
export async function setPrimaryPhoto(photoId: string, vehicleId: string): Promise<void> {
  if (!photoId || !vehicleId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Photo ID and vehicle ID required",
    });
  }

  // TODO: Update database to set primary photo
}

/**
 * Delete vehicle photo
 */
export async function deleteVehiclePhoto(photoId: string, vehicleId: string): Promise<void> {
  if (!photoId || !vehicleId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Photo ID and vehicle ID required",
    });
  }

  // TODO: Delete from database and S3
}

/**
 * Reorder photos
 */
export async function reorderPhotos(
  vehicleId: string,
  photoIds: string[],
): Promise<VehiclePhoto[]> {
  if (!vehicleId || !photoIds || photoIds.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Vehicle ID and photo IDs required",
    });
  }

  // TODO: Update database with new order
  // For now, return empty array
  return [];
}

/**
 * Generate thumbnail for photo
 */
export async function generatePhotoThumbnail(
  photoUrl: string,
  width: number = 200,
  height: number = 200,
): Promise<string> {
  if (!photoUrl) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Photo URL required",
    });
  }

  // TODO: Generate thumbnail using image processing service
  // For now, return original URL
  return photoUrl;
}
