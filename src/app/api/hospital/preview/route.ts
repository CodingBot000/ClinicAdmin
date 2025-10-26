import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import {
  TABLE_HOSPITAL,
  TABLE_DOCTOR,
  TABLE_HOSPITAL_DETAIL,
  TABLE_HOSPITAL_TREATMENT,
  TABLE_HOSPITAL_BUSINESS_HOUR,
  TABLE_TREATMENT_INFO,
  TABLE_FEEDBACKS,
  TABLE_CONTACTS,
  TABLE_TREATMENT_SELECTION,
  STORAGE_IMAGES
} from '@/constants/tables';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-utils';
import { getTreatmentsFilePath } from '@/constants/paths';

/**
 * GET /api/hospital/preview - Fetch ALL hospital data in one consolidated call
 * Query params: id_uuid_hospital (required)
 *
 * This endpoint replaces the 9 separate queries in PreviewClinicInfoModal
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_uuid_hospital = searchParams.get('id_uuid_hospital');

    if (!id_uuid_hospital || id_uuid_hospital.trim() === '' || id_uuid_hospital === 'undefined' || id_uuid_hospital === 'null') {
      return createErrorResponse('Hospital ID is required and must be valid', 400);
    }

    // Execute all queries in parallel for better performance
    const [
      hospitalResult,
      businessHoursResult,
      doctorsResult,
      treatmentsResult,
      hospitalDetailsResult,
      contactsResult,
      treatmentSelectionResult,
      supportTreatmentFeedbackResult,
      generalFeedbackResult
    ] = await Promise.all([
      // 1. Hospital basic info
      pool.query(
        `SELECT * FROM ${TABLE_HOSPITAL} WHERE id_uuid = $1`,
        [id_uuid_hospital]
      ),

      // 2. Business hours
      pool.query(
        `SELECT * FROM ${TABLE_HOSPITAL_BUSINESS_HOUR} WHERE id_uuid_hospital = $1 ORDER BY day_of_week ASC`,
        [id_uuid_hospital]
      ),

      // 3. Doctors
      pool.query(
        `SELECT * FROM ${TABLE_DOCTOR} WHERE id_uuid_hospital = $1 ORDER BY chief DESC`,
        [id_uuid_hospital]
      ),

      // 4. Treatments
      pool.query(
        `SELECT * FROM ${TABLE_HOSPITAL_TREATMENT} WHERE id_uuid_hospital = $1`,
        [id_uuid_hospital]
      ),

      // 5. Hospital details
      pool.query(
        `SELECT * FROM ${TABLE_HOSPITAL_DETAIL} WHERE id_uuid_hospital = $1`,
        [id_uuid_hospital]
      ),

      // 6. Contacts
      pool.query(
        `SELECT * FROM ${TABLE_CONTACTS} WHERE id_uuid_hospital = $1 ORDER BY type ASC, sequence ASC`,
        [id_uuid_hospital]
      ),

      // 7. Treatment selection
      pool.query(
        `SELECT category, ids, device_ids FROM ${TABLE_TREATMENT_SELECTION} WHERE id_uuid_hospital = $1`,
        [id_uuid_hospital]
      ),

      // 8. Support treatment feedback
      pool.query(
        `SELECT feedback_content FROM ${TABLE_FEEDBACKS} WHERE id_uuid_hospital = $1 AND type = $2 ORDER BY updated_at DESC LIMIT 1`,
        [id_uuid_hospital, 'support_treatment']
      ),

      // 9. General feedback
      pool.query(
        `SELECT feedback_content FROM ${TABLE_FEEDBACKS} WHERE id_uuid_hospital = $1 AND type IS NULL ORDER BY created_at DESC LIMIT 1`,
        [id_uuid_hospital]
      )
    ]);

    // Check for hospital data existence
    if (!hospitalResult.rows || hospitalResult.rows.length === 0) {
      throw new Error('Hospital not found');
    }

    const hospitalData = hospitalResult.rows[0];

    // Get treatment details if treatments exist
    let treatmentDetails: any[] = [];
    if (treatmentsResult.rows && treatmentsResult.rows.length > 0) {
      const treatmentUuids = treatmentsResult.rows
        .filter(treatment => treatment.id_uuid_treatment)
        .map(treatment => treatment.id_uuid_treatment);

      if (treatmentUuids.length > 0) {
        const placeholders = treatmentUuids.map((_, i) => `$${i + 1}`).join(',');
        const treatmentDetailResult = await pool.query(
          `SELECT id_uuid, code, name FROM ${TABLE_TREATMENT_INFO} WHERE id_uuid IN (${placeholders})`,
          treatmentUuids
        );
        treatmentDetails = treatmentDetailResult.rows || [];
      }
    }

    // Check for Excel file - placeholder (requires separate file storage service)
    let excelFileName = '';
    // TODO: Implement file check for AWS S3 or other storage service
    // const filePath = getTreatmentsFilePath(id_uuid_hospital);

    // Organize treatment selection data
    const skinData = treatmentSelectionResult.rows?.find(row => row.category === 'skin');
    const plasticData = treatmentSelectionResult.rows?.find(row => row.category === 'plastic');

    const treatmentSelection = {
      skinTreatmentIds: skinData?.ids || [],
      plasticTreatmentIds: plasticData?.ids || [],
      deviceIds: Array.from(new Set([
        ...(skinData?.device_ids || []),
        ...(plasticData?.device_ids || [])
      ])),
    };

    // Combine all data
    const combinedData = {
      ...hospitalData,
      business_hours: businessHoursResult.rows || [],
      doctors: doctorsResult.rows || [],
      treatments: treatmentsResult.rows || [],
      treatmentDetails: treatmentDetails || [],
      available_languages: hospitalDetailsResult.rows?.[0]?.available_languages || [],
      feedback: generalFeedbackResult.rows?.[0]?.feedback_content || '',
      contacts: contactsResult.rows || [],
      excelFileName,
      treatmentSelection,
      supportTreatmentFeedback: supportTreatmentFeedbackResult.rows?.[0]?.feedback_content || '',
      ...hospitalDetailsResult.rows?.[0],
    };

    return createSuccessResponse({ hospital: combinedData });

  } catch (error) {
    console.error('Hospital preview API error:', error);
    return handleApiError(error);
  }
}

/**
 * OPTIONS /api/hospital/preview - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
