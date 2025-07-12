"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

import Step1BasicInfo from "./Step1BasicInfo";
import Step2BusinessHours from "./Step2BusinessHours";
import Step3ClinicImagesDoctorsInfo from "./Step3ClinicImagesDoctorsInfo";
import Step4Treatments from "./Step4Treatments";
import Step5LanguagesFeedback from "./Step5LanguagesFeedback";
import PageHeader from "@/components/PageHeader";
import { getUserHospitalUuid, loadHospitalData } from "@/lib/hospitalDataLoader";

export default function ClinicInfoInsertClient(
  { currentUserUid, isEditMode }: { currentUserUid: string, isEditMode: boolean }
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ 쿼리에서 step 파라미터 가져오기
  const stepParam = searchParams.get("step");
  const step = stepParam ? parseInt(stepParam, 10) : 1;

  const [id_uuid_hospital, setIdUuidHospital] = useState('');
  const [hospitalName, setHospitalName] = useState('');

  const goNext = () => {
    const params = new URLSearchParams(searchParams);
    params.set("step", String(step + 1));
    router.replace(`?${params.toString()}`);
  };

  const goBack = () => {
    const params = new URLSearchParams(searchParams);
    params.set("step", String(step - 1));
    router.replace(`?${params.toString()}`);
  };

  const goToStep = (targetStep: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("step", String(targetStep));
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    console.log('ClinicInfoInsertClient isEditMode: ', isEditMode);
    if (!isEditMode) {
      const id_uuid_generate = uuidv4();
      setIdUuidHospital(id_uuid_generate);
      console.log('ClinicInfoInsertClient id_uuid_generate: ', id_uuid_generate);
    } else {
      const loadHospitalUuid = async () => {
        const hospitalUuid = await getUserHospitalUuid(currentUserUid);
        setIdUuidHospital(hospitalUuid ?? '');
        console.log('ClinicInfoInsertClient hospitalUuid: ', hospitalUuid);

        if (!hospitalUuid) {
         const hospitalName = await loadHospitalData(hospitalUuid!);
         setHospitalName(hospitalName);
        }
      };
      loadHospitalUuid();
    }
  }, []);

  const handlePreview = () => {
    console.log('handlePreview');
  };

  const handleSave = () => {
    console.log('handleSave');
  };

  return (
    <main>
      <PageHeader
        name={hospitalName ? `${hospitalName}님 환영합니다.` : `병원 정보를 입력하세요`}
        currentStep={step}
        onPreview={handlePreview}
        onSave={handleSave}
        onStepChange={goToStep}
      />

      {step === 1 && (
        <Step1BasicInfo
          id_uuid_hospital={id_uuid_hospital}
          setIdUUIDHospital={setIdUuidHospital}
          isEditMode={isEditMode}
          onNext={goNext}
          currentUserUid={currentUserUid}
        />
      )}
      {step === 2 && (
        <Step2BusinessHours
          id_uuid_hospital={id_uuid_hospital}
          isEditMode={isEditMode}
          onNext={goNext}
          onPrev={goBack}
          currentUserUid={currentUserUid}
        />
      )}
      {step === 3 && (
        <Step3ClinicImagesDoctorsInfo
          id_uuid_hospital={id_uuid_hospital}
          isEditMode={isEditMode}
          onNext={goNext}
          onPrev={goBack}
          currentUserUid={currentUserUid}
        />
      )}
      {step === 4 && (
        <Step4Treatments
          id_uuid_hospital={id_uuid_hospital}
          isEditMode={isEditMode}
          onNext={goNext}
          onPrev={goBack}
          currentUserUid={currentUserUid}
        />
      )}
      {step === 5 && (
        <Step5LanguagesFeedback
          id_uuid_hospital={id_uuid_hospital}
          isEditMode={isEditMode}
          onComplete={() => {
            router.replace('/admin');
            router.refresh();
          }}
          onPrev={goBack}
          onStepChange={goToStep}
          currentUserUid={currentUserUid}
        />
      )}
    </main>
  );
}
