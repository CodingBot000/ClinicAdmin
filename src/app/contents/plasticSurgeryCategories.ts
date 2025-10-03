import { CategoryNodeTag } from "@/types/category";

export const PLASTIC_SURGERY_CATEGORIES: CategoryNodeTag[] = [
  // { key: "recommend", ko: "추천", en: "Recommend" },
  {
    key: "eye",
    ko: "눈",
    en: "Eye",
    children: [
      {
        key: "double_eyelid",
        ko: "쌍꺼풀",
        en: "Double Eyelid",
        children: [
          { key: "natural_adhesion", ko: "자연유착", en: "Natural Adhesion" },
          { key: "buried", ko: "매몰", en: "Buried" },
          { key: "incision", ko: "절개", en: "Incision" },
          { key: "partial_incision", ko: "부분벌개", en: "Partial Incision" },
        ],
      },
      {
        key: "canthoplasty",
        ko: "트임",
        en: "Canthoplasty",
        children: [
          { key: "epicanthoplasty", ko: "앞트임", en: "Epicanthoplasty" },
          { key: "lateral_canthoplasty", ko: "뒤트임", en: "Lateral Canthoplasty" },
          { key: "upper_canthoplasty", ko: "윗트임", en: "Upper Canthoplasty" },
          { key: "lower_canthoplasty", ko: "밑트임", en: "Lower Canthoplasty" },
          { key: "mongolian_fold", ko: "몽고트임", en: "Mongolian Fold" },
          { key: "canthoplasty_revision", ko: "트임복원", en: "Canthoplasty Revision" },
        ],
      },
      {
        key: "ptosis_correction",
        ko: "눈매교정",
        en: "Ptosis Correction",
        children: [
          { key: "incision", ko: "절개", en: "Incision" },
          { key: "non_incision", ko: "비절개", en: "Non Incision" },
        ],
      },
      {
        key: "eye_shape_correction",
        ko: "눈모양교정",
        en: "Eye Shape Correction",
        children: [
          { key: "lower_eyelid_fat_reposition", ko: "눈밑지방재배치", en: "Lower Eyelid Fat Reposition" },
          { key: "upper_blepharoplasty", ko: "상안검", en: "Upper Blepharoplasty" },
          { key: "lower_blepharoplasty", ko: "하안검", en: "Lower Blepharoplasty" },
          { key: "brow_lift", ko: "눈썹거상", en: "Brow Lift" },
          { key: "lower_eyelid_fat_removal", ko: "눈밑지방제거", en: "Lower Eyelid Fat Removal" },
          { key: "eyelid_fat_removal", ko: "눈꺼풀지방제거", en: "Eyelid Fat Removal" },
        ],
      },
      {
        key: "eye_revision",
        ko: "눈재수술",
        en: "Eye Revision",
        children: [
          { key: "double_eyelid", ko: "쌍꺼풀", en: "Double Eyelid" },
          { key: "canthoplasty", ko: "트임", en: "Canthoplasty" },
          { key: "ptosis_correction", ko: "눈매교정", en: "Ptosis Correction" },
          { key: "eye_shape_correction", ko: "눈모양교정", en: "Eye Shape Correction" },
        ],
      },
    ],
  },
  {
    key: "nose",
    ko: "코",
    en: "Nose",
    children: [
      {
        key: "bridge",
        ko: "콧대",
        en: "Bridge",
        children: [
          { key: "bridge_autologous", ko: "콧대(자가조직)", en: "Bridge Autologous" },
          { key: "bridge_implant", ko: "콧대(보형물)", en: "Bridge Implant" },
          { key: "osteotomy", ko: "코절골술", en: "Osteotomy" },
        ],
      },
      {
        key: "tip",
        ko: "코끝",
        en: "Tip",
        children: [
          { key: "tip_autologous", ko: "코끝(자가조직)", en: "Tip Autologous" },
          { key: "tip_implant", ko: "코끝(보형물)", en: "Tip Implant" },
          { key: "tip_lengthening", ko: "코길이연장", en: "Tip Lengthening" },
        ],
      },
      {
        key: "ala",
        ko: "콧볼",
        en: "Ala",
        children: [
          { key: "non_incision", ko: "비절개", en: "Non Incision" },
          { key: "medial_incision", ko: "내측절개", en: "Medial Incision" },
        ],
      },
      {
        key: "functional",
        ko: "기능코",
        en: "Functional",
        children: [
          { key: "rhinitis_sinusitis", ko: "비염/축농증", en: "Rhinitis Sinusitis" },
          { key: "nasal_valve_stenosis", ko: "비밸브협착", en: "Nasal Valve Stenosis" },
          { key: "septal_deviation", ko: "비중격만곡", en: "Septal Deviation" },
        ],
      },
      {
        key: "nose_revision",
        ko: "코재수술",
        en: "Nose Revision",
        children: [
          { key: "bridge", ko: "콧대", en: "Bridge" },
          { key: "tip", ko: "코끝", en: "Tip" },
          { key: "ala", ko: "콧볼", en: "Ala" },
          { key: "functional", ko: "기능코", en: "Functional" },
        ],
      },
    ],
  },
  {
    key: "fat",
    ko: "지방흡입/이식",
    en: "Fat Graft",
    children: [
      {
        key: "body_liposuction",
        ko: "바디지방흡입",
        en: "Body Liposuction",
        children: [
          { key: "abdomen", ko: "복부", en: "Abdomen" },
          { key: "arm", ko: "팔", en: "Arm" },
          { key: "thigh", ko: "허벅지", en: "Thigh" },
          { key: "knee_calf_ankle", ko: "무릎/종아리/발목", en: "Knee Calf Ankle" },
          { key: "buttock", ko: "엉덩이", en: "Buttock" },
          { key: "trapezius_collar_back", ko: "승모근/쇄골/등", en: "Trapezius Collar Back" },
          { key: "flank_love_handle", ko: "옆구리/러브핸들", en: "Flank Love Handle" },
          { key: "breast", ko: "가슴", en: "Breast" },
          { key: "armpit_accessory_breast", ko: "겨드랑이/부유방", en: "Armpit Accessory Breast" },
          { key: "whole_body", ko: "전신", en: "Whole Body" },
        ],
      },
      {
        key: "face_liposuction",
        ko: "얼굴지방흡입",
        en: "Face Liposuction",
        children: [
          { key: "full_face", ko: "풀페이스", en: "Full Face" },
          { key: "forehead_glabella", ko: "이마/미간", en: "Forehead Glabella" },
          { key: "cheek_zygomatic", ko: "볼/광대", en: "Cheek Zygomatic" },
          { key: "chin", ko: "턱", en: "Chin" },
          { key: "nasolabial_fold", ko: "팔자", en: "Nasolabial Fold" },
        ],
      },
      {
        key: "face_fat_graft",
        ko: "얼굴지방이식",
        en: "Face Fat Graft",
        children: [
          { key: "full_face", ko: "풀페이스", en: "Full Face" },
          { key: "forehead_glabella", ko: "이마/미간", en: "Forehead Glabella" },
          { key: "cheek_zygomatic", ko: "볼/광대", en: "Cheek Zygomatic" },
          { key: "eyes", ko: "눈", en: "Eyes" },
          { key: "chin", ko: "턱", en: "Chin" },
          { key: "temple", ko: "관자놀이", en: "Temple" },
          { key: "nasolabial_fold", ko: "팔자", en: "Nasolabial Fold" },
          { key: "lips", ko: "입술", en: "Lips" },
        ],
      },
      {
        key: "body_fat_graft",
        ko: "바디지방이식",
        en: "Body Fat Graft",
        children: [
          { key: "breast", ko: "가슴", en: "Breast" },
          { key: "buttock_pelvis", ko: "엉덩이/골반", en: "Buttock Pelvis" },
          { key: "calf", ko: "종아리", en: "Calf" },
        ],
      },
    ],
  },
  {
    key: "outline",
    ko: "안면윤곽/양악",
    en: "Facial Contour/Jaw",
    children: [
      {
        key: "zygoma",
        ko: "광대",
        en: "Zygoma",
        children: [
          { key: "zygoma_implant", ko: "광대확대(보형물)", en: "Zygoma Implant" },
          { key: "zygoma_reduction", ko: "광대축소", en: "Zygoma Reduction" },
        ],
      },
      {
        key: "contour",
        ko: "윤곽",
        en: "Contour",
        children: [
          { key: "square_jaw", ko: "사각턱", en: "Square Jaw" },
          { key: "chin", ko: "턱끝", en: "Chin" },
          { key: "double_chin", ko: "이중턱", en: "Double Chin" },
          { key: "complex_face_vline", ko: "복합안면/V라인", en: "Complex Face Vline" },
          { key: "facelift", ko: "안면거상", en: "Facelift" },
        ],
      },
      {
        key: "forehead",
        ko: "이마",
        en: "Forehead",
        children: [
          { key: "forehead_implant", ko: "이마확대(보형물)", en: "Forehead Implant" },
          { key: "forehead_reduction", ko: "이마축소", en: "Forehead Reduction" },
          { key: "forehead_lift", ko: "이마거상", en: "Forehead Lift" },
        ],
      },
      {
        key: "two_jaw",
        ko: "양악",
        en: "Two Jaw",
        children: [
          { key: "two_jaw", ko: "양악", en: "Two Jaw" },
          { key: "upper_jaw", ko: "상악", en: "Upper Jaw" },
          { key: "lower_jaw", ko: "하악", en: "Lower Jaw" },
        ],
      },
      {
        key: "contour_revision",
        ko: "안면윤곽재수술",
        en: "Facial Contour Revision",
        children: [
          { key: "zygoma", ko: "광대", en: "Zygoma" },
          { key: "contour", ko: "윤곽", en: "Contour" },
          { key: "forehead", ko: "이마", en: "Forehead" },
          { key: "two_jaw", ko: "양악", en: "Two Jaw" },
        ],
      },
    ],
  },
  {
    key: "breast",
    ko: "가슴",
    en: "Breast",
    children: [
      {
        key: "breast_shape_correction",
        ko: "가슴모양교정",
        en: "Breast Shape Correction",
        children: [
          { key: "augmentation_implant", ko: "가슴확대(보형물)", en: "Augmentation Implant" },
          { key: "mastopexy", ko: "가슴거상", en: "Mastopexy" },
          { key: "reduction", ko: "가슴축소", en: "Reduction" },
          { key: "implant_removal", ko: "가슴보형물제거", en: "Implant Removal" },
          { key: "foreign_body_removal", ko: "가슴이물질제거", en: "Foreign Body Removal" },
          { key: "axillary_fat_removal", ko: "부유방지방제거", en: "Axillary Fat Removal" },
        ],
      },
      {
        key: "nipple_areola",
        ko: "유두/유륜",
        en: "Nipple Areola",
        children: [
          { key: "inverted_nipple", ko: "함몰유두", en: "Inverted Nipple" },
          { key: "nipple_areola_reduction", ko: "유두/유륜축소", en: "Nipple Areola Reduction" },
        ],
      },
      {
        key: "breast_revision",
        ko: "가슴재수술",
        en: "Breast Revision",
        children: [
          { key: "breast_shape_correction", ko: "가슴모양교정", en: "Breast Shape Correction" },
          { key: "nipple_areola", ko: "유두/유륜", en: "Nipple Areola" },
        ],
      },
    ],
  },
  {
    key: "mens",
    ko: "남자성형",
    en: "Mens",
    children: [
      {
        key: "eye",
        ko: "눈",
        en: "Eye",
        children: [
          { key: "double_eyelid_or_no_eyelid", ko: "쌍꺼풀/무쌍", en: "Double Eyelid Or No Eyelid" },
          { key: "canthoplasty", ko: "트임", en: "Canthoplasty" },
          { key: "ptosis_correction", ko: "눈매교정", en: "Ptosis Correction" },
          { key: "eye_shape_correction", ko: "눈모양교정", en: "Eye Shape Correction" },
        ],
      },
      {
        key: "nose",
        ko: "코",
        en: "Nose",
        children: [
          { key: "bridge", ko: "콧대", en: "Bridge" },
          { key: "tip", ko: "코끝", en: "Tip" },
          { key: "ala", ko: "콧볼", en: "Ala" },
          { key: "functional", ko: "기능코", en: "Functional" },
        ],
      },
      {
        key: "breast",
        ko: "가슴",
        en: "Breast",
        children: [
          { key: "gynecomastia", ko: "여유증", en: "Gynecomastia" },
          { key: "nipple_areola", ko: "유두/유륜", en: "Nipple Areola" },
        ],
      },
      {
        key: "liposuction_fat_graft",
        ko: "지방흡입/이식",
        en: "Liposuction/Fat Graft",
        children: [
          { key: "body_liposuction", ko: "바디지방흡입", en: "Body Liposuction" },
          { key: "face_liposuction", ko: "얼굴지방흡입", en: "Face Liposuction" },
          { key: "face_fat_graft", ko: "얼굴지방이식", en: "Face Fat Graft" },
          { key: "body_fat_graft", ko: "바디지방이식", en: "Body Fat Graft" },
        ],
      },
      {
        key: "facial_contour_jaw",
        ko: "안면윤곽/양악",
        en: "Facial Contour/Jaw",
        children: [
          { key: "zygoma", ko: "광대", en: "Zygoma" },
          { key: "contour", ko: "윤곽", en: "Contour" },
          { key: "forehead", ko: "이마", en: "Forehead" },
          { key: "two_jaw", ko: "양악", en: "Two Jaw" },
        ],
      },
    ],
  },
  {
    key: "etc",
    ko: "기타",
    en: "Etc",
    children: [
      { key: "female_surgery", ko: "여성성형", en: "Female Surgery" },
      { key: "body_lift", ko: "바디거상", en: "Body Lift" },
      { key: "lip_surgery", ko: "입술성형", en: "Lip Surgery" },
      { key: "philtrum_surgery", ko: "인중성형", en: "Philtrum Surgery" },
      { key: "nasolabial_surgery", ko: "팔자성형", en: "Nasolabial Surgery" },
      { key: "dimple_surgery", ko: "보조개성형", en: "Dimple Surgery" },
      { key: "buttock_surgery", ko: "엉덩이성형", en: "Buttock Surgery" },
      { key: "ear_surgery", ko: "귀성형", en: "Ear Surgery" },
      { key: "other_surgery", ko: "기타성형", en: "Other Surgery" },
    ],
  },
];
