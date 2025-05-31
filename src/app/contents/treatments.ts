import { CategoryNode } from "./CategoryNode";

export const TREATMENT_CATEGORIES: CategoryNode[] = [
    {
      key: "lifting",
      label: "리프팅",
      children: [
        {
          key: "radiofrequency",
          label: "고주파",
          children: [
            { key: "thermage", label: "써마지" },
            { key: "inmode", label: "인모드" },
            { key: "tune_face", label: "튠페이스" },
            { key: "density", label: "덴서티" },
            { key: "oligio", label: "올리지오" },
            { key: "etc_rf", label: "기타" },
          ],
        },
        {
          key: "ultrasound",
          label: "초음파",
          children: [
            { key: "ulthera", label: "울쎄라" },
            { key: "liftera", label: "리프테라" },
            { key: "shurink", label: "슈링크" },
          ],
        },
        {
          key: "titanium",
          label: "티타늄",
          children: [
            { key: "onda", label: "온다" },
            { key: "tuneliner", label: "튠라이너" },
            { key: "sop", label: "소프" },
            { key: "wave", label: "웨이브" },
          ],
        },
        {
          key: "eye",
          label: "눈가",
          children: [
            { key: "eye_shurink", label: "아이 슈링크" },
            { key: "eye_ulthera", label: "아이 울쎼라" },
            { key: "tuneeyes", label: "튠아이즈" },
            { key: "thermage_eye", label: "써마지 아이" },
          ],
        },
      ],
    },
    {
      key: "filler",
      label: "필러",
      children: [
        { key: "forehead", label: "이마" },
        { key: "glabella", label: "미간" },
        { key: "chin", label: "턱" },
        { key: "side_cheek", label: "옆볼" },
        { key: "under_eye", label: "눈밑" },
        { key: "aegyo", label: "애교" },
        { key: "shoulder", label: "어깨" },
        { key: "body", label: "바디" },
      ],
    },
    {
      key: "collagen_booster",
      label: "콜라겐 부스터",
      children: [
        { key: "sculptra", label: "스컬트라" },
        { key: "juvelook", label: "쥬베룩" },
      ],
    },
    {
      key: "botox",
      label: "보톡스",
      children: [
        { key: "eye_botox", label: "눈가" },
        { key: "glabella", label: "미간" },
        { key: "forehead", label: "이마" },
        { key: "chin", label: "턱" },
        { key: "salivary_gland", label: "침샘" },
        { key: "nose_bridge", label: "콧등" },
        { key: "skin_botox", label: "스킨보톡스" },
      ],
    },
    {
      key: "laser_pigment_redness",
      label: "레이저/ 색소/붉은기",
      children: [
        { key: "lipot", label: "리팟" },
        { key: "genesis", label: "제네시스" },
        { key: "pico", label: "피코" },
        { key: "revlite", label: "레블라이트" },
        { key: "ipl", label: "IPL" },
        { key: "lipot2", label: "리팟" },
        { key: "co2", label: "co2" },
        { key: "vbeam", label: "브이빔" },
        { key: "excel_v", label: "엑셀브이" },
        { key: "etc_laser", label: "기타" },
      ],
    },
    {
      key: "pore",
      label: "모공",
      children: [
        { key: "potenza", label: "포텐자" },
        { key: "secret", label: "시크릿" },
        { key: "fraxel", label: "프락셀" },
        { key: "etc_pore", label: "기타" },
      ],
    },
    {
      key: "scar",
      label: "흉터",
      children: [
        { key: "fraxel_genia", label: "프락셀제냐" },
        { key: "tripeel", label: "트리필" },
        { key: "juvgen", label: "주브젠" },
      ],
    },
    {
      key: "skin_booster",
      label: "스킨부스터",
      children: [
        { key: "rejuran", label: "리쥬란" },
        { key: "exosome", label: "엑소좀" },
        { key: "juvelook", label: "쥬베룩" },
        { key: "water_glow_injection", label: "물광주사" },
        { key: "stem_cell", label: "줄기세포" },
        { key: "etc_booster", label: "기타" },
      ],
    },
    {
      key: "peeling_care",
      label: "필링, 관리",
      children: [
        { key: "aladdin_peel", label: "알라딘필" },
        { key: "lalapeel", label: "라라필" },
        { key: "ldm", label: "ldm" },
      ],
    },
    {
      key: "acne",
      label: "여드름",
      children: [
        { key: "capri", label: "카프리" },
        { key: "neobeam", label: "네오빔" },
      ],
    },
  ];
  