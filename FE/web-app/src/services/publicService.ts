import apiClient from "@/lib/apiClient";

/**
 * Public Tracking Service
 * Handles public (unauthenticated) API calls for vehicle service tracking
 */

export interface TrackingInfo {
  vehicleProcessingRecordId: string;
  vin: string;
  checkInDate: string;
  checkOutDate?: string | null;
  odometer: number;
  status:
    | "CHECKED_IN"
    | "IN_DIAGNOSIS"
    | "WAITING_CUSTOMER_APPROVAL"
    | "PROCESSING"
    | "READY_FOR_PICKUP"
    | "COMPLETED"
    | "CANCELLED";
  mainTechnician?: {
    userId: string;
    name: string;
  } | null;
  vehicle?: {
    vin: string;
    model?: {
      name: string;
      vehicleModelId: string;
      company?: {
        vehicleCompanyId: string;
        name: string;
      };
    };
  };
  guaranteeCases?: Array<{
    guaranteeCaseId: string;
    status: string;
    contentGuarantee: string;
    caseLines?: Array<{
      id: string;
      diagnosisText?: string;
      correctionText?: string;
      warrantyStatus?: string;
      status: string;
      rejectionReason?: string;
      quantity?: number;
      typeComponent?: {
        typeComponentId: string;
        name: string;
        category: string;
      };
    }>;
  }>;
}

export interface TrackingResponse {
  status: "success";
  data: TrackingInfo;
}

/**
 * Get vehicle service tracking information by token
 * GET /api/public/tracking?token=<uuid>
 *
 * This is a public endpoint that doesn't require authentication.
 * Users receive the tracking token via email when their vehicle is checked in.
 *
 * @param token - UUID tracking token
 * @returns Vehicle processing record details
 */
export const getTrackingInfo = async (
  token: string
): Promise<TrackingResponse> => {
  try {
    const response = await apiClient.get("/api/public/tracking", {
      params: { token },
    });

    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching tracking info:", error);
    throw error;
  }
};

const publicService = {
  getTrackingInfo,
};

export default publicService;
