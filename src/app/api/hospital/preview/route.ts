import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
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

    if (!id_uuid_hospital) {
      return createErrorResponse('Hospital ID is required', 400);
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
      supabase
        .from(TABLE_HOSPITAL)
        .select('*')
        .eq('id_uuid', id_uuid_hospital)
        .single(),

      // 2. Business hours
      supabase
        .from(TABLE_HOSPITAL_BUSINESS_HOUR)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .order('day_of_week'),

      // 3. Doctors
      supabase
        .from(TABLE_DOCTOR)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .order('chief', { ascending: false }),

      // 4. Treatments
      supabase
        .from(TABLE_HOSPITAL_TREATMENT)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital),

      // 5. Hospital details
      supabase
        .from(TABLE_HOSPITAL_DETAIL)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .single(),

      // 6. Contacts
      supabase
        .from(TABLE_CONTACTS)
        .select('*')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .order('type, sequence'),

      // 7. Treatment selection
      supabase
        .from(TABLE_TREATMENT_SELECTION)
        .select('category, ids, device_ids')
        .eq('id_uuid_hospital', id_uuid_hospital),

      // 8. Support treatment feedback
      supabase
        .from(TABLE_FEEDBACKS)
        .select('feedback_content')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .eq('type', 'support_treatment')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 9. General feedback
      supabase
        .from(TABLE_FEEDBACKS)
        .select('feedback_content')
        .eq('id_uuid_hospital', id_uuid_hospital)
        .is('type', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    // Check for errors
    if (hospitalResult.error) throw hospitalResult.error;

    // Get treatment details if treatments exist
    let treatmentDetails: any[] = [];
    if (treatmentsResult.data && treatmentsResult.data.length > 0) {
      const treatmentUuids = treatmentsResult.data
        .filter(treatment => treatment.id_uuid_treatment)
        .map(treatment => treatment.id_uuid_treatment);

      if (treatmentUuids.length > 0) {
        const { data: treatmentData, error: treatmentDetailError } = await supabase
          .from(TABLE_TREATMENT_INFO)
          .select('id_uuid, code, name')
          .in('id_uuid', treatmentUuids);

        if (!treatmentDetailError) {
          treatmentDetails = treatmentData || [];
        }
      }
    }

    // Check for Excel file
    let excelFileName = '';
    try {
      const filePath = getTreatmentsFilePath(id_uuid_hospital);
      const { data: files, error: fileError } = await supabase.storage
        .from(STORAGE_IMAGES)
        .list(filePath);

      if (!fileError && files && files.length > 0) {
        const latestFile = files.sort((a, b) =>
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )[0];
        excelFileName = latestFile.name;
      }
    } catch (err) {
      console.error('Excel file check error:', err);
    }

    // Organize treatment selection data
    const skinData = treatmentSelectionResult.data?.find(row => row.category === 'skin');
    const plasticData = treatmentSelectionResult.data?.find(row => row.category === 'plastic');

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
      ...hospitalResult.data,
      business_hours: businessHoursResult.data || [],
      doctors: doctorsResult.data || [],
      treatments: treatmentsResult.data || [],
      treatmentDetails: treatmentDetails || [],
      available_languages: hospitalDetailsResult.data?.available_languages || [],
      feedback: generalFeedbackResult.data?.feedback_content || '',
      contacts: contactsResult.data || [],
      excelFileName,
      treatmentSelection,
      supportTreatmentFeedback: supportTreatmentFeedbackResult.data?.feedback_content || '',
      ...hospitalDetailsResult.data,
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
