import React, { useState } from 'react';
import InputField from './InputField';
import { Button } from './ui/button';
import { AlertModal } from './modal';
import { HelpCircle } from 'lucide-react';
import SNSConsentButton from './modal/SNSContentModal';
import Divider from './Divider';

interface SnsChannels {
  kakaoTalk: string;
  line: string;
  weChat: string;
  whatsApp: string;
  telegram: string;
  facebookMessenger: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  other_channel: string;
}

interface BasicInfo {
  name: string;
  email: string;
  tel: string;
  snsChannels: {
    kakaoTalk: string;
    line: string;
    weChat: string;
    whatsApp: string;
    telegram: string;
    facebookMessenger: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    other_channel: string;
  };
  snsContentAgreement: 1 | 0 | null;
}

interface BasicInfoSectionProps {
  onInfoChange: (info: BasicInfo) => void;
  initialInfo?: BasicInfo;
}

const SNS_CHANNEL_LABELS = {
  kakaoTalk: 'KakaoTalk',
  line: 'LINE',
  weChat: 'WeChat',
  whatsApp: 'WhatsApp',
  telegram: 'Telegram',
  facebookMessenger: 'Facebook\nMessenger',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'Youtube',
  other_channel: 'Other\nChannel',
} as const;

function MessengerTable() {
  const messengerData = [
    {
      messenger: "KakaoTalk",
      countries: "한국",
      comment: "한국 병원이라면 필수 채널",
    },
    {
      messenger: "LINE",
      countries: "일본, 태국, 대만",
      comment: "일본·동남아 핵심",
    },
    {
      messenger: "WeChat",
      countries: "중국",
      comment: "중국 고객 대응 필수, 없으면 불가능 수준",
    },
    {
      messenger: "WhatsApp",
      countries: "인도, 동남아, 유럽, 남미, 중동",
      comment: "거의 모든 영어권·남미·중동",
    },
    {
      messenger: "Telegram",
      countries: "러시아권, 중동, 인도",
      comment: "러시아/중동은 WhatsApp+Telegram이 표준",
    },
    {
      messenger: "Facebook Messenger",
      countries: "미국, 동남아, 남미",
      comment: "페북 기반 광고와 자연스럽게 연동됨",
    },
        {
      messenger: "Instagram DM",
      countries: "글로벌 (뷰티·성형·젊은층)",
      comment: "뷰티/성형 업종 핵심, 사진 기반 홍보 후 DM 문의",
    },
    {
      messenger: "TikTok DM",
      countries: "글로벌 (Z세대·바이럴)",
      comment: "영상 바이럴 후 DM 문의, 메인상담은 외부 메신저 연결 권장",
    },
    {
      messenger: "Youtube",
      countries: "글로벌 (뷰티·성형·젊은층)",
      comment: "뷰티/성형 업종 핵심, 사진 기반 홍보 후 DM 문의",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border-b border-gray-300 text-left">메신저</th>
            <th className="px-4 py-2 border-b border-gray-300 text-left">주요 대상 국가</th>
            <th className="px-4 py-2 border-b border-gray-300 text-left">코멘트</th>
          </tr>
        </thead>
        <tbody>
          {messengerData.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b border-gray-200">{item.messenger}</td>
              <td className="px-4 py-2 border-b border-gray-200">{item.countries}</td>
              <td className="px-4 py-2 border-b border-gray-200">{item.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BasicInfoSection = ({
  onInfoChange,
  initialInfo,
}: BasicInfoSectionProps) => {
  const [info, setInfo] = useState<BasicInfo>(
    initialInfo || {
      name: '',
      email: '',
      tel: '',
      snsChannels: {
        kakaoTalk: '',
        line: '',
        weChat: '',
        whatsApp: '',
        telegram: '',
        facebookMessenger: '',
        instagram: '',
        tiktok: '',
        youtube: '',
        other_channel: '',
      },
      snsContentAgreement: null,
    }
  );

  const [showSnsModal, setShowSnsModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleChange = (
    field: keyof BasicInfo,
    value: string
  ) => {
    const newInfo = { ...info, [field]: value };
    setInfo(newInfo);
    onInfoChange(newInfo);
  };

  const handleSnsChange = (
    channel: keyof SnsChannels,
    value: string
  ) => {
    const newInfo = {
      ...info,
      snsChannels: {
        ...info.snsChannels,
        [channel]: value,
      },
    };
    setInfo(newInfo);
    onInfoChange(newInfo);
  };

  const handleSnsAgreementChange = (value: 1 | 0) => {
    const newInfo = {
      ...info,
      snsContentAgreement: value,
    };
    setInfo(newInfo);
    onInfoChange(newInfo);
  };

  // 활성화된 SNS 채널 목록 (값이 있는 채널만)
  const activeChannels = Object.entries(info.snsChannels)
    .filter(([_, value]) => value)
    .map(([key]) => SNS_CHANNEL_LABELS[key as keyof SnsChannels]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">기본 정보</h3>
        <InputField
          label="병원명"
          name="name"
          required
          value={info.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <InputField
          label="이메일"
          name="email"
          type="email"
          required
          value={info.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
        <InputField
          label="전화번호"
          name="tel"
          type="tel"
          required
          value={info.tel}
          onChange={(e) => handleChange('tel', e.target.value)}
        />

        <Divider />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">SNS 상담 채널</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className='text-xs bg-black text-white'
              onClick={() => setShowSnsModal(true)}
            >
              추가하기
            </Button>
            <h4 className="text-sm text-gray-400">
              카카오톡 외에도 필요시 새로 만드셔서 추가하시길 적극 권장합니다. 향후 언제든지 추가/변경 가능합니다. 
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              onClick={() => setShowGuideModal(true)}
            >
              <HelpCircle className="w-4 h-4" />
              채널별 가이드 보기
            </Button>
          </div>
          
          {activeChannels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeChannels.map((channel) => (
                <div
                  key={channel}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {channel}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertModal
        open={showSnsModal}
        onCancel={() => setShowSnsModal(false)}
        onConfirm={() => setShowSnsModal(false)}
        showCancelButton
        cancelText="닫기"
        confirmText="저장"
        className="max-w-lg"
        title="SNS 채널 정보 입력"
      >
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-500 mb-2">
            각 SNS 채널의 주소를 입력해주세요. 입력하지 않은 채널은 표시되지 않습니다. 
          </p>
          <p className="text-sm text-red-500 mb-2">
            해외 이용자를 위해 여러채널을 추가해주시는게 좋습니다.
          </p>
          
          {Object.entries(SNS_CHANNEL_LABELS).map(([key, label]) => (
            <InputField
              key={key}
              label={label}
              name={`sns_${key}`}
              value={info.snsChannels[key as keyof SnsChannels]}
              onChange={(e) =>
                handleSnsChange(key as keyof SnsChannels, e.target.value)
              }
              placeholder={`${label} 주소 입력`}
            />
          ))}
        </div>
      </AlertModal>

      <AlertModal
        open={showGuideModal}
        onCancel={() => setShowGuideModal(false)}
        onConfirm={() => setShowGuideModal(false)}
        showCancelButton={false}
        confirmText="확인"
        className="max-w-4xl"
        title="SNS 채널별 가이드"
      >
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-6">
            각 SNS 채널별 주요 대상 국가와 특징을 확인하세요.
          </p>
          <MessengerTable />
        </div>
      </AlertModal>

      {/* SNS 채널 컨텐츠 이용 동의 */}
      <div className="space-y-4">
      
      <div className="flex items-center  gap-4">
        <h3 className="text-lg font-semibold text-red-400">
            SNS 홍보 채널의 컨텐츠 이용 동의
        </h3>
        <SNSConsentButton />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="snsAgreement"
                checked={info.snsContentAgreement === 1}
                onChange={() => handleSnsAgreementChange(1)}
                className="w-4 h-4 text-blue-600"
              />
              <span>컨텐츠 이용 동의</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="snsAgreement"
                checked={info.snsContentAgreement === 0}
                onChange={() => handleSnsAgreementChange(0)}
                className="w-4 h-4 text-blue-600"
              />
              <span>컨텐츠 이용을 동의하지 않음</span>
            </label>
          </div>
     
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
