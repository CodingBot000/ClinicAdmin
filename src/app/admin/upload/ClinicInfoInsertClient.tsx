"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

import Step1BasicInfo from "./Step1BasicInfo";
import Step2BasicContactInfo from "./Step2BasicContactInfo";
import Step3BusinessHours from "./Step3BusinessHours";
import Step4ClinicImagesDoctorsInfo from "./Step4ClinicImagesDoctorsInfo";
import Step5Treatments from "./Step5Treatments";
import Step6LanguagesFeedback from "./Step6LanguagesFeedback";
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

  // useEffect(() => {
  //   document.body.style.overflow = '';
  //   return () => {
  //     document.body.style.overflow = '';
  //   };
  // }, []);

  /**
   * 병원 UUID 초기화
   * case 1  계정 로그인 후 바로 생성된 케이스  (admin에 id_uuid_hospital가 없고 hospital에도 데이터가 없는 최초생성 케이스)
   * case 2 계정 로그인 후 admin 생성했지만 이슈가 있어서 admin의 id_uuid_hospital 컬럼에 값은있으나 hospital테이블에는 데이터가 없는 케이스
   * case 3 계정 로그인 후 admin 생성했고 admin에 id_uuid_hospital가 있으며  hospital에도 해당 id_uuid_hospital로 데이터가 있는 케이스
   */
  useEffect(() => {
    log.info('ClinicInfoInsertClient isEditMode: ', isEditMode);
    
    const initializeHospitalUuid = async () => {
      // 시작하자마자 제일먼저 병원 UUID가 있는지 확인
      const hospitalUuid = await getUserHospitalUuid(currentUserUid);
      log.info('ClinicInfoInsertClient hospitalUuid: ', hospitalUuid);
     
      if (!isEditMode) {
        if (hospitalUuid) {
          // case 2
          // hospitalUuid가 있으면 기존 것을 사용
          setIdUuidHospital(hospitalUuid);
          log.info('ClinicInfoInsertClient exist hospitaluuid: ', hospitalUuid);
        } else {
          // case 1
          const id_uuid_generate = uuidv4();
          setIdUuidHospital(id_uuid_generate);
          log.info('ClinicInfoInsertClient id_uuid_generate: ', id_uuid_generate);
        }        
        
      } else {
        // case 3
        const loadHospitalUuid = async () => {
          const hospitalUuid = await getUserHospitalUuid(currentUserUid);
          setIdUuidHospital(hospitalUuid ?? '');
          log.info('ClinicInfoInsertClient hospitalUuid: ', hospitalUuid);
  
          if (!hospitalUuid) {
           const hospitalName = await loadHospitalData(hospitalUuid!);
           setHospitalName(hospitalName);
          }
        };
        loadHospitalUuid();
      }
    };
    
    initializeHospitalUuid();
  }, []);

  
  const handlePreview = () => {
    log.info('handlePreview');
  };

  const handleSave = () => {
    log.info('handleSave');
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
        <Step2BasicContactInfo
          id_uuid_hospital={id_uuid_hospital}
          setIdUUIDHospital={setIdUuidHospital}
          isEditMode={isEditMode}
          onNext={goNext}
          onPrev={goBack}
          currentUserUid={currentUserUid}
        />
      )}
      {step === 3 && (
        <Step3BusinessHours
          id_uuid_hospital={id_uuid_hospital}
          isEditMode={isEditMode}
          onNext={goNext}
          onPrev={goBack}
          currentUserUid={currentUserUid}
        />
      )}
      {step === 4 && (
        <Step4ClinicImagesDoctorsInfo
          id_uuid_hospital={id_uuid_hospital}
          isEditMode={isEditMode}
          onNext={goNext}
          onPrev={goBack}
          currentUserUid={currentUserUid}
        />
      )}
      {step === 5 && (
        <Step5Treatments
          id_uuid_hospital={id_uuid_hospital}
          isEditMode={isEditMode}
          onNext={goNext}
          onPrev={goBack}
          currentUserUid={currentUserUid}
        />
      )}
      {step === 6 && (
        <Step6LanguagesFeedback
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
