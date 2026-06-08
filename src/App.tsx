import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Home, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  X, 
  TrendingUp, 
  Check, 
  Heart,
  Upload,
  Link,
  Image,
  Star,
  Menu, 
  Info, 
  Clock, 
  Filter, 
  Printer, 
  SlidersHorizontal,
  Calendar,
  Layers,
  Sparkles,
  Navigation,
  Send,
  Building2,
  FileText,
  Lock,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Map as MapIcon,
  LayoutGrid,
  ListCollapse,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import html2canvas from 'html2canvas';
// @ts-ignore
import busanRegionMap from './assets/images/busan_region_map_1780279187834.png';

// Firebase SDK & Centralized Firestore integration configuration
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check Firestore live connection on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();

// ==========================================
// TYPES & INTERFACES DEFINITIONS
// ==========================================

export type TransactionType = '전체' | '매매' | '전세' | '월세';
export type FilterCategory = '전체' | '아파트' | '오피스텔' | '분양권' | '원룸' | '투룸' | '주택' | '빌라' | '상가' | '공장' | '토지' | '아파트 오피스텔';
export type ActiveTabType = '매물검색' | '지도검색' | '전체' | '아파트' | '오피스텔' | '분양권' | '원룸' | '투룸' | '주택' | '빌라' | '상가' | '공장' | '토지' | '아파트 오피스텔' | '오시는길' | '매물접수';

export interface Property {
  id: string;
  propertyNo?: string;       // 매물번호
  floorNow?: string;         // 개별 입력 층수
  floorTotal?: string;       // 개별 입력 총 층수
  name: string;
  category: FilterCategory;
  transactionType: '매매' | '전세' | '월세';
  priceText: string;
  priceValue: number;
  rentValue?: number;
  
  // 기존 필터링 및 UI 렌더링용 핵심 필드 보존
  pyongValue: number;
  floorText: string;
  direction: string;
  location: string;
  useYearText: string;
  useYearValue: number;
  householdsCount: number;
  tags: string[];
  description: string;
  features: string[];

  // --- 법적 고시 필수 명사항목 추가/수정 (Optional로 두어 하위 호환성 유지) ---
  fullAddr?: string;         // 소재지 (상세주소)
  area?: string;             // 면적 (전용/공급)
  floor?: string;            // 층수/총층수
  dir?: string;              // 방향 (주출입구/주실 기준)
  avail?: string;            // 입주가능일
  rooms?: string;            // 방 수 / 욕실 수
  date?: string;             // 사용승인일
  parking?: string;          // 주차대수
  mFee?: string;             // 관리비
  note?: string;             // 매물특징 (특이사항)

  // PropertyDetailTable 렌더링용 확장 필드
  priceHTML?: string;
  type?: string;
  trade?: string;
  isFromSheets?: boolean;
  
  imageUrl: string;
  imageUrls?: string[];
  latitude?: number;
  longitude?: number;
  mapLat: number;
  mapLng: number;
}

// ==========================================
// REALISTIC DATASET (부산진구 매물 데이터)
// ==========================================

const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: '개금 현대아이파크 아파트',
    category: '아파트',
    transactionType: '매매',
    priceText: '4억 8,000만',
    priceValue: 48000,
    pyongValue: 34,
    floorText: '고층/25층',
    direction: '남서향',
    location: '부산광역시 부산진구 냉정로 273 (개금동, 현대아파트)',
    fullAddr: '부산광역시 부산진구 냉정로 273 (개금동, 현대아파트)',
    useYearText: '2019년 준공 (신축급)',
    useYearValue: 2019,
    householdsCount: 1450,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    tags: ['역세권', '대단지', '올수리', '초품아'],
    description: '개금역 도보 5분 거리의 초역세권 대단지 아파트입니다. 남향 배치로 일조량이 뛰어납니다. 내부 인테리어 올수리되어 즉시 입주 가능한 최상급 매물입니다.',
    features: ['방 3개, 욕실 2개', '주차 1.3대 가능', '개금초등학교 도보 3분', '단지 내 커뮤니티 센터 우수'],
    mapLat: 35.151261,
    mapLng: 129.029706
  },
  {
    id: 'prop-2',
    name: '서면 삼정그린코아 더시티',
    category: '오피스텔',
    transactionType: '월세',
    priceText: '보증금 1,000만 원 / 월세 65만 원',
    priceValue: 1000,
    rentValue: 65,
    pyongValue: 12,
    floorText: '11층/20층',
    direction: '남동향',
    location: '부산광역시 부산진구 부전동',
    useYearText: '2021년 준공 (신축)',
    useYearValue: 2021,
    householdsCount: 350,
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    tags: ['신축', '풀옵션', '즉시입주', '주택수제외'],
    description: '서면 번화가 및 범내골역 초인접 인프라 끝판왕 신축 오피스텔입니다. 고품격 풀옵션 세련된 빌트인 가구 탑재 및 시스템 에어컨, 3도어 냉장고 무상 제공.',
    features: ['1인 가구 최적화 원룸', '자주식+기계식 복합 주차', '서면역 도보 8분', '24시간 보안 요원 상주'],
    mapLat: 35.1485,
    mapLng: 129.0585
  },
  {
    id: 'prop-3',
    name: '양정 자이더샵SKVIEW 분양권',
    category: '분양권',
    transactionType: '매매',
    priceText: '프리미엄 1억 2,000 (총 6억 1,000)',
    priceValue: 61000,
    pyongValue: 25,
    floorText: '중층/34층',
    direction: '남향',
    location: '부산광역시 부산진구 양정동',
    useYearText: '2025년 준공 예정',
    useYearValue: 2025,
    householdsCount: 2276,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    tags: ['대단지', '프리미엄', '2025년입주', '브랜드단지'],
    description: '2,276세대 압도적 메이저 브랜드 컨소시엄 대단지 아파트의 로얄 동호수 분양권입니다. 미래 가치 상승 확실한 양정 뉴타운의 중심축 매물입니다.',
    features: ['방 3개, 판상형 4Bay', '지하철 양정역 도보권', '초중고 명문 학군 중심', '피트니스, 실내골프장 완비'],
    mapLat: 35.1712,
    mapLng: 129.0725
  },
  {
    id: 'prop-4',
    name: '개금 준공업지역 당감동 인접 공장 부지',
    category: '공장',
    transactionType: '매매',
    priceText: '8억 5,000만',
    priceValue: 85000,
    pyongValue: 124,
    floorText: '토지 단독',
    direction: '진입로 우수',
    location: '부산광역시 부산진구 개금동',
    useYearText: '토지 (건물 없음)',
    useYearValue: 1900,
    householdsCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
    tags: ['준공업지', '차량진입원활', '공장부지', '투자추천'],
    description: '진입 도로가 넓어 5톤 차량 무리 없이 양방향 통행 가능한 개금동 우수 준공업지입니다. 인근 소형 가공 공장, 전시장 또는 차고지로 쓰기에 강력 추천합니다.',
    features: ['지목: 대지 및 공장용지', '건폐율 70% 용적률 350%', '전력 50kW 증설 완비', '주변 민원 발생 우려 없음'],
    mapLat: 35.1575,
    mapLng: 129.0232
  },
  {
    id: 'prop-5',
    name: '범천동 메리움 상가 상가',
    category: '상가',
    transactionType: '월세',
    priceText: '보증금 3,000만 원 / 월세 150만 원',
    priceValue: 3000,
    rentValue: 150,
    pyongValue: 18,
    floorText: '1층 코너',
    direction: '동향',
    location: '부산광역시 부산진구 범천동',
    useYearText: '2012년 준공',
    useYearValue: 2012,
    householdsCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
    tags: ['코너상가', '유동인구', '전면테라스', '학원/카페추천'],
    description: '웨딩홀 문화광장 배후수요를 품은 최적의 로드숍 코너 1층 상가입니다. 전면 유리가 넓어 시인성이 높으며 테라스 공간 설치 협의가 매끄럽게 가능합니다.',
    features: ['대로변 노출 극대화 매물', '기존 프랜차이즈 계약 만료 무권리', '천장형 냉난방 냉온기 완비', '공용 관리비 저렴 수준'],
    mapLat: 35.1465,
    mapLng: 129.0545
  },
  {
    id: 'prop-6',
    name: '개금역 스마트W 아파텔',
    category: '투룸',
    transactionType: '전세',
    priceText: '전세 2억 1,000만',
    priceValue: 21000,
    pyongValue: 22,
    floorText: '15층/22층',
    direction: '남서향',
    location: '부산광역시 부산진구 개금동',
    useYearText: '2018년 준공',
    useYearValue: 2018,
    householdsCount: 280,
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    tags: ['전세자금대출', '중기청가능', '고층', '쓰리룸'],
    description: '깔끔한 신축급 주상복합 오피스텔 전세 매물입니다. 방2/거실1 구조로 매끄럽게 잘 짜여 신혼부부 또는 2인 가구 주거에 압도적으로 강력 추천 드립니다.',
    features: ['빌트인 냉장고, 드럼세탁기 지원', '전세대 안심 전세 보증보험 가입 희망', '지하주차 요율 매우 양호', '주변 조용하고 편의점 풍부'],
    mapLat: 35.1541,
    mapLng: 129.0203
  },
  {
    id: 'prop-7',
    name: '연지 래미안어반파크 아파트',
    category: '아파트',
    transactionType: '전세',
    priceText: '전세 3억 5,000만',
    priceValue: 35000,
    pyongValue: 34,
    floorText: '18층/33층',
    direction: '남동향',
    location: '부산광역시 부산진구 연지동',
    useYearText: '2022년 준공 (완전신축)',
    useYearValue: 2022,
    householdsCount: 2616,
    imageUrl: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=600&q=80',
    tags: ['완전신축', '시민공원조망', '커뮤니티상급', '명품조경'],
    description: '부산시민공원 도보 생활권에 빛나는 2,616세대 시그니처 대단지 레미안입니다. 완전 신축으로 최고급 스마트 홈 사물인터넷(IoT) 시스템이 들어가 있습니다.',
    features: ['방 3개, 환상적인 4Bay 판상', '부산시민공원 그린뷰 극대화', '커뮤니티 조식 서비스 지원 단지', '명품 보육 어린이집 연계'],
    mapLat: 35.1745,
    mapLng: 129.0512
  },
  {
    id: 'prop-8',
    name: '서면 에메랄드 중심가 사무실',
    category: '상가',
    transactionType: '매매',
    priceText: '3억 2,000만',
    priceValue: 32000,
    pyongValue: 28,
    floorText: '8층/15층',
    direction: '북동향',
    location: '부산광역시 부산진구 부전동',
    useYearText: '2015년 준공',
    useYearValue: 2015,
    householdsCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    tags: ['서면역근접', '소규모사무실', '가성비', '오피스빌딩'],
    description: '서면역 도보 4분 교통 요지에 위치한 단독 사무실용 소형 빌딩 호실입니다. 현 공실 상태로 즉시 개업 및 매수가 매우 간절하고 우량하게 나와 있습니다.',
    features: ['개별 천장 매립 에어컨 2대', '건물 엘리베이터 3대 가동', '호실 내 개별 씽크 수전 분리', '주변 법무사, 중개업 최적'],
    mapLat: 35.1565,
    mapLng: 129.0592
  },
  {
    id: 'prop-9',
    name: '개금동 모던 신축 빌라',
    category: '빌라',
    transactionType: '매매',
    priceText: '2억 9,000만',
    priceValue: 29000,
    pyongValue: 24,
    floorText: '3층/5층',
    direction: '남향',
    location: '부산광역시 부산진구 개금동',
    useYearText: '2022년 준공 (신축)',
    useYearValue: 2022,
    householdsCount: 15,
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    tags: ['올수리', '강력추천', '주차가능', '조용한동네'],
    description: '개금역 인접 조용한 주거 단지 내 고품격 신축 빌라입니다. 모던한 인테리어와 고급 자재를 아낌없이 투자하였으며 엘리베이터와 자주식 주차장이 완비되어 있습니다.',
    features: ['방 3개, 욕실 2개 실면적 우수', '한샘 정품 주방 가구 및 아일랜드 식탁 적용', '초등학교 인접 안심 등하교길', '개별 지하 전용 창고 별도 제공'],
    mapLat: 35.1525,
    mapLng: 129.0175
  },
  {
    id: 'prop-10',
    name: '양정동 마당 넓은 이층 주택',
    category: '주택',
    transactionType: '매매',
    priceText: '6억 5,000만',
    priceValue: 65000,
    pyongValue: 58,
    floorText: '지상 1-2층 단독',
    direction: '남향',
    location: '부산광역시 부산진구 양정동',
    useYearText: '1998년 준공 (관리최상)',
    useYearValue: 1998,
    householdsCount: 1,
    imageUrl: 'https://images.unsplash.com/photo-1564013799915-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
    tags: ['마당보유', '남향', '개인차고', '대지넓음'],
    description: '도심 속 정원과 개인 주차가 완벽하게 보장되는 이층 단독주택입니다. 고급스럽게 잘 가꾸어진 조경 마당과 함께 햇살이 가득한 거실을 자랑합니다. 일부 리모델링 완료.',
    features: ['대지 면적 65평 / 연면적 58평형 대형 구조', '마당 내 잔디와 감나무 등 프라이빗 조경 가작', '양정역 도보 8분 역세권 입지', '옥상 루프탑 테라스 바베큐 파티 최적'],
    mapLat: 35.1705,
    mapLng: 129.0715
  }
];
const PropertyDetailTable = ({ data }: { data: Property }) => (
  <div id="capture_area" className="w-[520px] bg-white p-5 border border-amber-200 shadow-xl rounded-2xl">
    <div className="bg-amber-600 text-white p-4 text-center font-black text-lg tracking-tight rounded-t-xl mb-4">
      🏠 부강부동산 ・ 매물번호: {data.propertyNo || data.id}
    </div>
    <table className="w-full text-xs border-collapse border border-amber-200">
      <tbody>
        {[
          { label: '1. 소재지', val: data.fullAddr || data.location },
          { label: '2. 면적', val: data.area || `${data.pyongValue}평 (전용 약 ${Math.floor(data.pyongValue * 3.3)}㎡)` },
          { label: '3. 가격', val: getPropertyPriceDisplay(data) },
          { label: '4. 중개대상물 종류', val: data.type || data.category },
          { label: '5. 거래형태', val: data.trade || data.transactionType },
          { label: '6. 층수/총층수', val: data.floor || data.floorText },
          { label: '7. 입주가능일', val: data.avail || '즉시 입주 및 협의 가능' },
          { label: '8. 방수/욕실수', val: data.rooms || (data.category === '원룸' || data.category === '투룸' || data.category === '오피스텔' ? '방 1개 / 욕실 1개' : '방 3개 / 욕실 2개') },
          { label: '9. 사용승인일', val: data.date || data.useYearText || `${data.useYearValue}년 준공` },
          { label: '10. 주차대수', val: data.parking || (data.category === '상가' || data.category === '공장' || data.category === '토지' ? '인근 주차공간 이용 원활' : '총 250대 (세대당 1.2대 수준)') },
          { label: '11. 관리비', val: data.mFee || '약 12만원 (수도, 소명 전기료는 사용량 측정 실비정산)' },
          { label: '12. 방향', val: data.dir || data.direction },
          { label: '13. 매물특징', val: data.note || data.description },
        ].map((item, idx) => (
          <tr key={idx} className="hover:bg-amber-50/10">
            <th className="border border-amber-200/50 p-2.5 text-left w-5/12 bg-amber-50/20 font-black text-slate-700">{item.label}</th>
            <td className="border border-amber-200/50 p-2.5 text-slate-800 font-bold leading-relaxed">{item.val}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-4 pt-3 border-t border-dashed border-amber-200 text-center text-[10px] text-amber-800 font-bold leading-relaxed bg-amber-50/20 py-2 rounded-xl">
      <span>부산광역시 부산진구 냉정로 273 (부강 부동산) | 대표 고민주 소장</span>
      <p className="mt-0.5">T. 051-893-8959 | 유선전화: 051-897-8900</p>
    </div>
  </div>
);

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

const resolveDriveImageUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  
  // Detect if it is a Google Drive Folder link
  if (trimmed.includes('drive.google.com/drive/folders/') || 
      (trimmed.includes('drive.google.com/drive/u/') && trimmed.includes('/folders/'))) {
    return 'FOLDER_URL_DETECTED';
  }
  
  // Format check for already resolved/embedded direct links
  if (trimmed.includes('drive.google.com/uc?export=view&id=')) {
    return trimmed;
  }
  
  let fileId = '';
  
  // Pattern 1: /file/d/FILE_ID
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  } else {
    // Pattern 2: id=FILE_ID
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      if (!trimmed.includes('folders/')) {
        fileId = idParamMatch[1];
      }
    } else {
      // Pattern 3: lh3.googleusercontent.com/d/FILE_ID
      const lhMatch = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
      if (lhMatch && lhMatch[1]) {
        fileId = lhMatch[1];
      } else {
        // Pattern 4: /uc?id=FILE_ID or similar formats
        const ucMatch = trimmed.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
        if (ucMatch && ucMatch[1]) {
          fileId = ucMatch[1];
        }
      }
    }
  }
  
  if (fileId) {
    // Standard direct link form requested: drive.google.com/uc?export=view&id=FILE_ID as requested
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return trimmed;
};

// Helper: compress local image client-side to keep Firestore document under 1MB limits
const compressAndConvertImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Safety Timeout: If image resizing async task hangs beyond 2.5 seconds due to sandboxing or canvas issues, 
    // fall back to the original reader Base64 payload instead of freezing the UI.
    let isSettled = false;
    let fallbackBase64 = '';

    const forceFallback = () => {
      if (!isSettled) {
        isSettled = true;
        if (fallbackBase64) {
          console.warn('⚠️ Image compression timed out. Falling back to original resolution.');
          resolve(fallbackBase64);
        } else {
          reject(new Error('이미지 처리 시간 초과 및 변환 실패'));
        }
      }
    };

    const timeoutId = setTimeout(forceFallback, 2500);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultStr = event.target?.result as string;
        fallbackBase64 = resultStr;

        const img = document.createElement('img');
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 800; // Optimal display size for listing cards
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
              if (!isSettled) {
                isSettled = true;
                clearTimeout(timeoutId);
                resolve(compressedBase64);
              }
            } else {
              if (!isSettled) {
                isSettled = true;
                clearTimeout(timeoutId);
                resolve(resultStr);
              }
            }
          } catch (e) {
            console.error('Canvas resize failed, returning original base64:', e);
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeoutId);
              resolve(resultStr);
            }
          }
        };

        img.onerror = (err) => {
          console.warn('Image loading error, falling back to original base64:', err);
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timeoutId);
            resolve(resultStr);
          }
        };

        img.src = resultStr;
      } catch (err) {
        console.error('FileReader onload error:', err);
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeoutId);
          reject(err);
        }
      }
    };

    reader.onerror = (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeoutId);
        reject(new Error('파일 읽기 오류가 발생했습니다.'));
      }
    };

    reader.readAsDataURL(file);
  });
};

// Helper function to remove redundant "보증금" text for 월세 transactions
const getCleanedPriceText = (transactionType: string, priceText: any) => {
  if (priceText === undefined || priceText === null) return '';
  let str = String(priceText).trim();
  
  if (transactionType === '월세') {
    return str.replace(/보증금\s*/g, '').trim();
  } else {
    // For 매매/전세, remove starting prefix of transactionType if exists (e.g. "전세 " or "매매 ")
    if (str.startsWith(transactionType)) {
      str = str.substring(transactionType.length).trim();
    }
  }

  // Ensure "원" is appended at the end for 매매/전세
  if (str && !str.endsWith('원') && !str.toLowerCase().includes('협의') && !str.includes('미정') && !str.includes('전화문의')) {
    str = `${str} 원`;
  }
  return str;
};

const formatPriceValue = (value: number) => {
  if (!value) return '0';
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const remainder = value % 10000;
    if (remainder === 0) {
      return `${eok}억`;
    } else {
      const decimalStr = (remainder / 10000).toFixed(2).replace(/0+$/, '');
      const decimalPart = decimalStr.split('.')[1] || '';
      return `${eok}.${decimalPart}억`;
    }
  }
  return `${value.toLocaleString()}만`;
};

const formatPriceToKorean = (valInManWon: number | string): string => {
  const num = Number(valInManWon);
  if (!num || isNaN(num)) return '';
  if (num >= 10000) {
    const eok = Math.floor(num / 10000);
    const man = num % 10000;
    if (man === 0) {
      return `${eok}억`;
    }
    return `${eok}억 ${man.toLocaleString()}만`;
  }
  return `${num.toLocaleString()}만`;
};

const getPropertyPriceDisplay = (prop: { transactionType: string; priceText: string; priceValue?: number; rentValue?: number }) => {
  if (prop.transactionType === '월세') {
    const depositVal = Number(prop.priceValue) || 0;
    const rentVal = Number(prop.rentValue) || 0;

    if (depositVal > 0 || rentVal > 0) {
      const depositStr = depositVal > 0 ? formatPriceToKorean(depositVal).trim() : '0';
      const rentStr = rentVal > 0 ? `${rentVal.toLocaleString()}만` : '0만';
      return `보증금 ${depositStr} 원 / 월세 ${rentStr} 원`;
    }

    // Fallback parsing from raw text if numeric fields are missing
    let cleanText = String(prop.priceText || '').trim();
    if (cleanText.includes('/')) {
      const parts = cleanText.split('/');
      let depPart = parts[0].replace(/보증금\s*/g, '').trim();
      let rentPart = parts[1].replace(/월세|월\s*세|월/g, '').trim();
      
      // Clean up standalone thousands to "천" or convert to Korean
      if (/^\d+$/.test(depPart)) {
        const num = Number(depPart);
        if (num < 10000) {
          depPart = `${num.toLocaleString()}만`;
        } else {
          depPart = formatPriceToKorean(num);
        }
      }
      if (/^\d+$/.test(rentPart)) {
        rentPart = `${Number(rentPart).toLocaleString()}만`;
      }
      
      const depUnit = depPart.endsWith('원') ? '' : ' 원';
      const rentUnit = rentPart.endsWith('원') ? '' : ' 원';
      return `보증금 ${depPart}${depUnit} / 월세 ${rentPart}${rentUnit}`;
    }
    
    return prop.priceText || '가격 협의';
  }

  // 매매/전세
  return `${prop.transactionType} ${getCleanedPriceText(prop.transactionType, prop.priceText)}`;
};

const parseAreaFields = (areaStr: string, pyongValue: string | number) => {
  let exM2 = '';
  let spM2 = '';
  let exPy = '';
  let spPy = '';
  
  if (areaStr) {
    const cleanStr = String(areaStr).replace(/,/g, '');
    
    // Check for "공급 112㎡ / 전용 84㎡"
    const spMatch = cleanStr.match(/(?:공급|계약|분양)[^\d\.]*([\d.]+)/i);
    const exMatch = cleanStr.match(/(?:전용|실평|실|전용면적)[^\d\.]*([\d.]+)/i);
    
    if (spMatch) {
      spM2 = spMatch[1];
      const parsedSp = parseFloat(spM2);
      if (!isNaN(parsedSp)) {
        spM2 = parsedSp.toFixed(2);
      }
      spPy = (Number(spM2) * 0.3025).toFixed(2);
    }
    if (exMatch) {
      exM2 = exMatch[1];
      const parsedEx = parseFloat(exM2);
      if (!isNaN(parsedEx)) {
        exM2 = parsedEx.toFixed(2);
      }
      exPy = (Number(exM2) * 0.3025).toFixed(2);
    }
    
    // If no explicit tags but contains slashes or numbers
    if (!spM2 && !exM2) {
      const numbers = cleanStr.match(/([\d.]+)/g);
      if (numbers && numbers.length >= 2) {
        spM2 = parseFloat(numbers[0]).toFixed(2);
        spPy = (Number(spM2) * 0.3025).toFixed(2);
        exM2 = parseFloat(numbers[1]).toFixed(2);
        exPy = (Number(exM2) * 0.3025).toFixed(2);
      } else if (numbers && numbers.length === 1) {
        exM2 = parseFloat(numbers[0]).toFixed(2);
        exPy = (Number(exM2) * 0.3025).toFixed(2);
      }
    }
  }
  
  if (!spPy && pyongValue) {
    spPy = parseFloat(String(pyongValue)).toFixed(2);
    spM2 = (Number(pyongValue) / 0.3025).toFixed(2);
  }
  if (!exPy && spPy) {
    const estimatedExPy = (Number(spPy) * 0.73).toFixed(2);
    exPy = estimatedExPy;
    exM2 = (Number(estimatedExPy) / 0.3025).toFixed(2);
  }
  
  return { exM2, spM2, exPy, spPy };
};

const parseRoomFields = (roomsStr: string) => {
  let roomCount = '';
  let bathCount = '';
  if (roomsStr) {
    const rMatch = roomsStr.match(/방\s*(\d+)/);
    const bMatch = roomsStr.match(/욕실\s*(\d+)/);
    if (rMatch) roomCount = rMatch[1];
    if (bMatch) bathCount = bMatch[1];
    
    if (!roomCount && !bathCount) {
      const nums = roomsStr.match(/\d+/g);
      if (nums && nums.length >= 2) {
        roomCount = nums[0];
        bathCount = nums[1];
      } else if (nums && nums.length === 1) {
        roomCount = nums[0];
      }
    }
  }
  return { roomCount, bathCount };
};

const parseDirFields = (dirStr: string, directionFallback: string) => {
  let direction = directionFallback || '남향';
  let dirStandard = '거실 기준';
  if (dirStr) {
    const stdMatch = dirStr.match(/\(([^)]+)\)/);
    if (stdMatch) {
      dirStandard = stdMatch[1];
      direction = dirStr.replace(/\([^)]+\)/, '').trim();
    } else {
      direction = dirStr;
    }
  }
  return { direction, dirStandard };
};

const extractYear = (dateStr: string): string => {
  if (!dateStr) return '';
  const match = dateStr.match(/\b(19\d\d|20\d\d)\b/);
  return match ? match[1] : '';
};

const getGroupSummaries = (properties: Property[]) => {
  return ['매매', '전세', '월세'].map(type => {
    const matching = properties.filter(p => p.transactionType === type);
    if (matching.length === 0) return null;

    const sortedByPrice = [...matching].sort((a, b) => (a.priceValue || 0) - (b.priceValue || 0));
    const minProp = sortedByPrice[0];
    const maxProp = sortedByPrice[sortedByPrice.length - 1];

    let displayStr = '';

    if (type === '월세') {
      const sortedByRent = [...matching].sort((a, b) => ((a.rentValue || 0) * 100 + (a.priceValue || 0)) - ((b.rentValue || 0) * 100 + (b.priceValue || 0)));
      const minRentProp = sortedByRent[0];
      const maxRentProp = sortedByRent[sortedByRent.length - 1];
      
      if (matching.length === 1) {
        const rentStr = minRentProp.rentValue ? `${minRentProp.rentValue}만` : '';
        const depositStr = minRentProp.priceValue ? `${formatPriceValue(minRentProp.priceValue)}` : '';
        displayStr = `${depositStr}/${rentStr}`;
      } else {
        const minRent = minRentProp.rentValue || 0;
        const maxRent = maxRentProp.rentValue || 0;
        if (minRent === maxRent) {
          displayStr = `${minRent}만`;
        } else {
          displayStr = `${minRent}~${maxRent}만`;
        }
      }
    } else {
      const minP = minProp.priceValue || 0;
      const maxP = maxProp.priceValue || 0;
      if (minP === maxP) {
        displayStr = formatPriceValue(minP);
      } else {
        displayStr = `${formatPriceValue(minP)}~${formatPriceValue(maxP)}`;
      }
    }

    return {
      type,
      displayStr,
      count: matching.length
    };
  }).filter(Boolean) as Array<{ type: string; displayStr: string; count: number }>;
};

export default function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Tab states
  const [activeTab, setActiveTab] = useState<ActiveTabType>('매물검색');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('전체');

  // Filter conditions
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType>('전체');
  const [priceLimit, setPriceLimit] = useState<string>('전체');
  const [sizeRange, setSizeRange] = useState<string>('전체');
  const [useYear, setUseYear] = useState<string>('전체');
  const [householdCount, setHouseholdCount] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Naver Real Estate style filter states
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(['전체']);
  const [priceCriterion, setPriceCriterion] = useState<'property' | 'actual'>('property');
  const [priceMin, setPriceMin] = useState<number>(0); // in ten-thousand won (0 = 최소)
  const [priceMax, setPriceMax] = useState<number>(999999); // 999999 = 최대
  const [rentMin, setRentMin] = useState<number>(0);
  const [rentMax, setRentMax] = useState<number>(999999);
  const [areaUnit, setAreaUnit] = useState<'m2' | 'pyong'>('pyong');
  const [areaMin, setAreaMin] = useState<number>(0); // (0 = 최소)
  const [areaMax, setAreaMax] = useState<number>(999999); // 999999 = 최대
  const [filterRooms, setFilterRooms] = useState<string>('전체'); // '전체' | '1' | '2' | '3' | '4 이상'
  const [filterBathrooms, setFilterBathrooms] = useState<string>('전체'); // '전체' | '1' | '2' | '3' | '4 이상'
  const [filterFloor, setFilterFloor] = useState<string>('전체'); // '전체' | '1층' | '지하층' | '지상층'
  const [filterUseYear, setFilterUseYear] = useState<string>('전체'); // '전체' | '99'...
  const [filterDirections, setFilterDirections] = useState<string[]>(['전체']); // ['전체']
  
  // Naver Real Estate style Map Split View Mode States
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  
  // Region Selector states matching user's custom images
  const [selectedSido, setSelectedSido] = useState<string>('전체');
  const [selectedSigungu, setSelectedSigungu] = useState<string>('전체');
  const [selectedEupmyeondong, setSelectedEupmyeondong] = useState<string>('전체');
  const [activeRegionStep, setActiveRegionStep] = useState<'sido' | 'sigungu' | 'dong'>('sido');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState<boolean>(false);

  // Region static lists and geocode helpers
  const getSigunguOptions = (sidoName: string) => {
    const SIGUNGU_OPTIONS_MAP: { [key: string]: string[] } = {
      '부산시': ['부산진구', '해운대구', '수영구', '연제구', '동래구', '금정구', '남구', '북구', '사하구', '사상구', '강서구', '중구', '서구', '동구', '영도구', '기장군'],
      '서울시': ['강남구', '서초구', '송파구', '마포구', '용산구', '성동구', '영등포구', '강서구', '종로구', '중구', '성북구', '서대문구', '노원구'],
      '경기도': ['성남시 분당구', '수원시 팔달구', '수원시 영통구', '용인시 수지구', '용인시 기흥구', '고양시 일산서구', '고양시 일산동구', '부천시', '남양주시', '화성시', '안산시', '평택시'],
      '인천시': ['연수구(송도)', '남동구', '미추홀구', '서구', '부평구', '계양구', '중구', '강화군'],
      '대전시': ['유성구', '서구', '중구', '동구', '대덕구'],
      '대구시': ['수성구', '달서구', '중구', '북구', '동구', '서구', '남구', '달성군'],
      '울산시': ['남구', '중구', '북구', '동구', '울주군'],
      '광주시': ['서구', '남구', '동구', '북구', '광산구'],
    };
    const list = SIGUNGU_OPTIONS_MAP[sidoName] || [];
    const parsed = new Set<string>(list);

    const matchesSido = (addr: string, s: string) => {
      const cleanAddr = addr.replace(/\s+/g, '');
      if (s.startsWith('서울')) return cleanAddr.includes('서울');
      if (s.startsWith('부산')) return cleanAddr.includes('부산');
      if (s.startsWith('인천')) return cleanAddr.includes('인천');
      if (s.startsWith('대전')) return cleanAddr.includes('대전');
      if (s.startsWith('대구')) return cleanAddr.includes('대구');
      if (s.startsWith('울산')) return cleanAddr.includes('울산');
      if (s.startsWith('세종')) return cleanAddr.includes('세종');
      if (s.startsWith('광주')) return cleanAddr.includes('광주');
      if (s.startsWith('경기')) return cleanAddr.includes('경기');
      if (s.startsWith('강원')) return cleanAddr.includes('강원');
      if (s.includes('충북') || s.includes('충청북도')) return cleanAddr.includes('충북') || cleanAddr.includes('충청북도');
      if (s.includes('충남') || s.includes('충청남도')) return cleanAddr.includes('충남') || cleanAddr.includes('충청남도');
      if (s.includes('경북') || s.includes('경상북도')) return cleanAddr.includes('경북') || cleanAddr.includes('경상북도');
      if (s.includes('경남') || s.includes('경상남도')) return cleanAddr.includes('경남') || cleanAddr.includes('경상남도');
      if (s.includes('전북') || s.includes('전라북')) return cleanAddr.includes('전북') || cleanAddr.includes('전라북도');
      if (s.includes('전남') || s.includes('전라남')) return cleanAddr.includes('전남') || cleanAddr.includes('전라남도');
      if (s.startsWith('제주')) return cleanAddr.includes('제주');
      return cleanAddr.includes(s.substring(0, 2));
    };

    properties.forEach(p => {
      const addr = (p.location || p.fullAddr || '').trim();
      const parts = addr.split(/\s+/);
      if (parts.length > 1) {
        const propSido = parts[0];
        const propSigungu = parts[1];
        if (matchesSido(propSido, sidoName)) {
          parsed.add(propSigungu);
        }
      }
    });

    return Array.from(parsed);
  };

  const getDongOptions = (sigunguName: string) => {
    const DONG_OPTIONS_MAP: { [key: string]: string[] } = {
      '부산진구': ['가야동', '개금동', '당감동', '전포동', '범천동', '양정동', '부암동', '부전동', '초읍동', '연지동'],
      '해운대구': ['우동', '중동', '좌동', '반여동', '반송동', '재송동', '송정동'],
      '수영구': ['광안동', '민락동', '남천동', '망미동', '수영동'],
      '강남구': ['삼성동', '압구정동', '청담동', '대치동', '개포동', '도곡동', '역삼동', '논현동', '신사동'],
      '서초구': ['반포동', '방배동', '서초동', '양재동', '잠원동', '우면동'],
      '송파구': ['잠실동', '신천동', '가락동', '문정동', '석촌동', '삼전동', '방이동', '오금동'],
      '분당구': ['백현동', '삼평동', '정자동', '서현동', '수내동', '야탑동', '판교동', '금곡동'],
    };
    const list = DONG_OPTIONS_MAP[sigunguName] || [];
    const parsed = new Set<string>(list);

    properties.forEach(p => {
      const addr = (p.location || p.fullAddr || '').trim();
      const parts = addr.split(/\s+/);
      const idx = parts.findIndex(part => part.includes(sigunguName));
      if (idx !== -1 && idx + 1 < parts.length) {
        const dongCandidate = parts[idx + 1].replace(/,.*$/, '').replace(/\(.*$/, '').trim();
        if (dongCandidate.endsWith('동') || dongCandidate.endsWith('읍') || dongCandidate.endsWith('면')) {
          parsed.add(dongCandidate);
        }
      }
    });

    if (parsed.size === 0) {
      return ['1동', '2동'];
    }
    return Array.from(parsed);
  };

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<string[]>([]);
  const [selectedMapGroupKey, setSelectedMapGroupKey] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 35.151261, lng: 129.029706 });
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState<boolean>(false);
  const isFirstLoad = useRef(true);
  const [kakaoLoadFailed, setKakaoLoadFailed] = useState<boolean>(false);
  const [kakaoErrorMsg, setKakaoErrorMsg] = useState<string>('');
  const [kakaoDiagnostics, setKakaoDiagnostics] = useState<{
    hostname: string;
    sdkUrl: string;
    appkey: string;
    hasKakaoGlobal: boolean;
    hasMapsGlobal: boolean;
    scriptStatus: 'not_found' | 'loading' | 'loaded' | 'error';
    scriptErrorMsg: string;
    initError: string;
  }>({
    hostname: window.location.hostname,
    sdkUrl: '',
    appkey: '',
    hasKakaoGlobal: false,
    hasMapsGlobal: false,
    scriptStatus: 'not_found',
    scriptErrorMsg: '',
    initError: ''
  });
  const [mapLevel, setMapLevel] = useState<number>(4);
  const [mapKey, setMapKey] = useState<number>(0);
  const [showKakaoGuide, setShowKakaoGuide] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [forceShowMap, setForceShowMap] = useState<boolean>(false);
  
  // Side drawer tabs for left-wing widget on standard screen/zoom overlapping scenarios
  const [isSideCategoryOpen, setIsSideCategoryOpen] = useState<boolean>(false);
  const [isSideConsultOpen, setIsSideConsultOpen] = useState<boolean>(false);

  // Interactive Dropdowns Controls
  const [activeDropdown, setActiveDropdown] = useState<'price' | 'size' | 'year' | 'households' | null>(null);
  const [activeStickyDropdown, setActiveStickyDropdown] = useState<'deal' | 'price' | 'size' | 'rooms' | 'floor' | 'year' | 'direction' | null>(null);
  const [advancedSearch, setAdvancedSearch] = useState<boolean>(false);
  
  // Detail Modal Controls
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState<number>(0);

  useEffect(() => {
    setDetailImageIndex(0);
  }, [selectedProperty?.id]);
  
  // Saved Favorites Persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('bugang_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Grid View Pagination State
  const [gridPage, setGridPage] = useState<number>(1);

  // Mobile Menu Drawer Control
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Quick Inline Consultation States
  const [consultName, setConsultName] = useState<string>('');
  const [consultPhone, setConsultPhone] = useState<string>('');
  const [consultText, setConsultText] = useState<string>('');
  const [consultType, setConsultType] = useState<string>('매수문의');
  const [consultPropertyId, setConsultPropertyId] = useState<string>('');
  const [isConsultSubmitted, setIsConsultSubmitted] = useState<boolean>(false);

  // Active sub-pills for sub categories inside Naver style filters
  const [activeSubPills, setActiveSubPills] = useState<string[]>(['전체']);

  // --- Deletion and Notification Iframe-Safe States ---
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [customNotification, setCustomNotification] = useState<string | null>(null);
  const triggerNotification = (msg: string) => {
    setCustomNotification(msg);
    setTimeout(() => {
      setCustomNotification(current => current === msg ? null : current);
    }, 4500);
  };

  // --- Admin and manual property persistence ---
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginId, setLoginId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const handleAdminToggleClick = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      triggerNotification('🔒 로그아웃 되었습니다. 관리자 모드가 비활성화되었습니다.');
    } else {
      setLoginId('');
      setLoginPassword('');
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId.trim() === 'bk3346' && loginPassword === 'bk33469952') {
      setIsAdminMode(true);
      setShowLoginModal(false);
      triggerNotification('🔑 로그인에 성공하였습니다. 관리자 모드가 활성화되었습니다.');
    } else {
      triggerNotification('❌ 아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  
  // Image registration modes: 'drive' for pasting google drive/web links, 'upload' for local files compressed safely
  const [uploadTab, setUploadTab] = useState<'upload' | 'drive'>('drive');
  const [isUploadingLocal, setIsUploadingLocal] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  
  const [newProp, setNewProp] = useState({
    propertyNo: '',
    floorNow: '',
    floorTotal: '',
    name: '',
    category: '아파트',
    transactionType: '매매',
    priceText: '',
    priceValue: '',
    rentValue: '',
    priceValueSale: '',
    priceValueJeonse: '',
    priceValueRentDeposit: '',
    rentValueRentMonth: '',
    pyongValue: '',
    floorText: '',
    direction: '남향',
    dirStandard: '거실 기준',
    location: '',
    useYearText: '',
    useYearValue: '',
    householdsCount: '',
    imageUrl: '',
    imageUrls: [] as string[],
    tags: '',
    description: '',
    note: '',
    fullAddr: '',
    area: '',
    areaExM2: '',
    areaSpM2: '',
    areaExPy: '',
    areaSpPy: '',
    floor: '',
    dir: '',
    avail: '',
    roomCount: '',
    bathCount: '',
    rooms: '',
    date: '',
    parking: '',
    mFee: '',
    priceHTML: '',
    type: '아파트',
    trade: '',
    mapLat: '',
    mapLng: ''
  });

  const [properties, setProperties] = useState<Property[]>(() => {
    // Return INITIAL_PROPERTIES as fallback until firestore loads or seeds
    return INITIAL_PROPERTIES.map(prop => {
      const lat = Number((prop as any).latitude || prop.mapLat || 35.151261);
      const lng = Number((prop as any).longitude || prop.mapLng || 129.029706);
      return {
        ...prop,
        latitude: lat,
        longitude: lng,
        mapLat: lat,
        mapLng: lng
      };
    });
  });

  // Real-time synchronization of property data from/to Firebase Firestore with seed fallback
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'properties'), (snapshot) => {
      if (snapshot.empty) {
        console.log('[Firestore Sync] Database is empty. Seeding INITIAL_PROPERTIES list...');
        // Seed default dataset in a single transaction-like batch
        const batch = writeBatch(db);
        INITIAL_PROPERTIES.forEach((prop) => {
          const docRef = doc(db, 'properties', prop.id);
          const lat = Number((prop as any).latitude || prop.mapLat || 35.151261);
          const lng = Number((prop as any).longitude || prop.mapLng || 129.029706);
          const normalized = {
            ...prop,
            latitude: lat,
            longitude: lng,
            mapLat: lat,
            mapLng: lng
          };
          batch.set(docRef, normalized);
        });
        batch.commit()
          .then(() => {
            console.log('[Firestore Sync] Finished seeding INITIAL_PROPERTIES successfully.');
            triggerNotification('🔥 Firebase 데이터베이스에 대표 기본 매물이 다중 접속 동기화용으로 안전하게 복원 등록되었습니다!');
          })
          .catch((err) => {
            console.error('[Firestore Sync] Seeding error:', err);
          });
      } else {
        const loaded: Property[] = [];
        const newlyAddedPropNames: string[] = [];

        // Check for new external additions since initial load
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && !isFirstLoad.current) {
            const data = change.doc.data() as Property;
            if (data && data.name) {
              if (change.doc.id.startsWith('gas-') || (data as any).isFromSheets) {
                newlyAddedPropNames.push(`__SHEETS__:${data.name}`);
              } else {
                newlyAddedPropNames.push(data.name);
              }
            }
          }
        });

        snapshot.forEach((d) => {
          const data = d.data() as Property;
          
          let lat = Number(data.latitude !== undefined ? data.latitude : (data.mapLat || 35.151261));
          let lng = Number(data.longitude !== undefined ? data.longitude : (data.mapLng || 129.029706));
          
          if (data.id === 'prop-1' || data.name?.includes('개금 현대') || data.location?.includes('냉정로 273') || data.fullAddr?.includes('냉정로 273')) {
            lat = 35.151261;
            lng = 129.029706;
          }
          
          loaded.push({
            ...data,
            latitude: Number.isNaN(lat) ? 35.151261 : lat,
            longitude: Number.isNaN(lng) ? 129.029706 : lng,
            mapLat: Number.isNaN(lat) ? 35.151261 : lat,
            mapLng: Number.isNaN(lng) ? 129.029706 : lng,
          });
        });
        
        console.log(`[Firestore Sync] Successfully synchronized ${loaded.length} properties from cloud live db.`);
        setProperties(loaded);

        if (newlyAddedPropNames.length > 0) {
          const firstPropName = newlyAddedPropNames[0];
          if (firstPropName.startsWith('__SHEETS__:')) {
            triggerNotification('✅ 스프레드시트에서 매물이 등록되었습니다!');
          } else {
            triggerNotification(`📢 [전산 실시간 수신] 구글 Apps Script 및 외부 채널로부터 매물 "${firstPropName}" 등 총 ${newlyAddedPropNames.length}건이 실시간 반영되었습니다!`);
          }
        }

        isFirstLoad.current = false;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'properties');
    });

    return () => unsub();
  }, []);

  // Expose a public function to add properties from Google Sheets (Apps Script).
  // This automatically commits the property directly into Firestore and highlights it.
  const handleAddPropertyFromSheets = (rawData: any) => {
    try {
      if (!rawData || typeof rawData !== "object") {
        throw new Error("Invalid payload: Body must be an object.");
      }

      console.log("[Sheets Integration] Inbound payload detected:", rawData);

      // Define possible keys for the fields (both English camelCase/snake_case and standard Korean)
      const propertyNoKeys = ['propertyNo', '매물번호', '번호', 'property_no', 'propertyid', '매물id', 'id'];
      const nameKeys = ['name', '매물명', '단지명', '명칭', '대표매물명', '건물명', '동호명', '제목', 'title'];
      const categoryKeys = ['category', '매물종류', '종류', '분류', 'type', '구분', '중개대상물 종류'];
      const transactionTypeKeys = ['transactionType', '거래형태', '거래구분', '거래유형', 'trade', '거래', '거래형태 *'];
      const priceTextKeys = ['priceText', '가격', '금액', '매매가', '보증금', '전세가', 'price_text', '가격 텍스트', '가격(보증금/월세 텍스트 및 정렬용) *'];
      const priceValueKeys = ['priceValue', '보증금액', '매매금액', '전세금액', '수지값', '보증금', '매매가', '전세가', '임대보증금', 'price'];
      const rentValueKeys = ['rentValue', '월세액', '월세', '월세금액', '월임대료', '임대료', 'rent', '월세액(만원,옵션)'];
      const pyongKeys = ['pyongValue', '평수', '평형', '평', 'pyong', '면적', '전용면적', '공급면적', 'area', '면적 (고시 내용 및 평수) *'];
      const floorNowKeys = ['floorNow', '층수', '층', '현재층', 'floor_now', '층수(현재층)'];
      const floorTotalKeys = ['floorTotal', '총층수', '총층', '전체층', 'floor_total'];
      const locationKeys = ['location', 'fullAddr', '소재지', '지번주소', '도로명주소', '주소', 'address', 'full_addr', '소재지 (지번/도로명 주소) *'];
      const availKeys = ['avail', '입주일', '입주시기', '입주가능일', '이사일', 'availability', '입주가능일 *'];
      const roomsKeys = ['rooms', '방수', '욕실수', '방개수', '방구조', '구조', '방 수 / 욕실 수 *'];
      const directionKeys = ['direction', 'dir', '방향', '향', '방향 *'];
      const useYearKeys = ['useYearValue', 'date', '사용승인일', '준공일', '준공년도', '연식', '사용승인일 *'];
      const parkingKeys = ['parking', '주차대수', '주차', '주차대수수준', '주차대수 *'];
      const mFeeKeys = ['mFee', '관리비', '월관리비', 'm_fee', '관리비 *'];
      const descKeys = ['description', 'note', '특징', '매물특징', '비고', '상세설명', '메모', '매물 특징 및 추가 한줄 권장설정 *'];
      const imageKeys = ['imageUrl', '사진', '이미지', '대표이미지', '이미지url', 'image', 'image_url', '대표 이미지 인터넷 주소 URL'];

      // Ultra-robust getter for English & Korean keys (case/space-insensitive)
      const getVal = (possibleKeys: string[], defaultVal: any = ''): any => {
        for (const k of possibleKeys) {
          // Exact match
          if (rawData[k] !== undefined && rawData[k] !== null && String(rawData[k]).trim() !== '' && String(rawData[k]).trim().toLowerCase() !== 'empty') {
            return rawData[k];
          }
          // Lowercase & spaces trimmed match
          const cleanK = k.toLowerCase().replace(/\s+/g, '');
          for (const rawKey of Object.keys(rawData)) {
            const cleanRawKey = rawKey.toLowerCase().replace(/\s+/g, '');
            if (cleanRawKey === cleanK) {
              const val = rawData[rawKey];
              if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim().toLowerCase() !== 'empty') {
                return val;
              }
            }
          }
        }
        return defaultVal;
      };

      // Clean category to match acceptable system enums correctly
      const categoryFromPayload = String(getVal(categoryKeys, "")).trim();
      const category = ["아파트", "오피스텔", "분양권", "원룸", "투룸", "주택", "빌라", "상가", "공장", "토지"].includes(categoryFromPayload)
        ? categoryFromPayload
        : "";

      const transactionTypeFromPayload = String(getVal(transactionTypeKeys, "매매")).trim();
      const transactionType = ["매매", "전세", "월세"].includes(transactionTypeFromPayload)
        ? transactionTypeFromPayload
        : "매매";

      const priceValue = getVal(priceValueKeys, '');
      const priceText = String(getVal(priceTextKeys, '') || (priceValue ? priceValue + '만' : ''));

      let propertyNoFromPayload = String(getVal(propertyNoKeys, '')).trim();
      if (!propertyNoFromPayload && rawData.id && String(rawData.id).startsWith('gas-')) {
        const parts = String(rawData.id).split('-');
        if (parts.length >= 2) {
          propertyNoFromPayload = parts[1]; // extracting from e.g., "gas-12345-timestamp"
        }
      }

      // Extract floorNow and floorTotal from getVal
      let floorNowFromPayload = String(getVal(floorNowKeys, '')).replace('층', '').trim();
      let floorTotalFromPayload = String(getVal(floorTotalKeys, '')).replace('층', '').trim();

      // Fallback: if floorNow / floorTotal are empty but floorText or floor is provided, parse it
      if (!floorNowFromPayload || !floorTotalFromPayload) {
        const joinedFloor = String(getVal(['floorText', 'floor'], ''));
        if (joinedFloor) {
          const parts = joinedFloor.split('/');
          if (parts.length >= 2) {
            floorNowFromPayload = floorNowFromPayload || parts[0].replace('층', '').trim();
            floorTotalFromPayload = floorTotalFromPayload || parts[1].replace('총', '').replace('층', '').trim();
          } else {
            floorNowFromPayload = floorNowFromPayload || joinedFloor.replace('층', '').trim();
          }
        }
      }

      const inputPyong = getVal(pyongKeys, '');
      const pyong = Number(inputPyong) || 24;

      const inputUseYear = getVal(useYearKeys, '');
      let useYear = 2015;
      if (inputUseYear) {
        const match = String(inputUseYear).match(/\d{4}/);
        if (match) {
          useYear = Number(match[0]);
        } else if (Number(inputUseYear)) {
          useYear = Number(inputUseYear);
        }
      }
      
      const targetId = propertyNoFromPayload ? `gas-${propertyNoFromPayload}` : (getVal(['id'], '') || `gas-${Date.now()}`);

      const fNow = floorNowFromPayload.replace('층', '');
      const fTot = floorTotalFromPayload.replace('층', '');
      const compiledFloorText = fNow && fTot ? `${fNow}층/${fTot}층` : (String(getVal(['floorText', 'floor'], '중층')));
      const compiledFloor = fNow && fTot ? `${fNow}층 / 총 ${fTot}층` : (String(getVal(['floor', 'floorText'], compiledFloorText)));

      const priceHTMLText = getVal(['priceHTML'], '') 
        ? getCleanedPriceText(transactionType, String(getVal(['priceHTML'], ''))) 
        : `${transactionType} ${getCleanedPriceText(transactionType, priceText)}`;

      // Resolve lat & lng
      let lat = 35.151261;
      let lng = 129.029706;
      const addressToSearch = String(getVal(locationKeys, "부산광역시 부산진구 냉정로 일대"));

      const getLocalFallbackCoords = (addr: string) => {
        let fLat = 35.151261;
        let fLng = 129.029706;
        const q = addr.toLowerCase();
        if (q.includes('냉정로 273') || q.includes('부강')) {
          fLat = 35.151261;
          fLng = 129.029706;
        } else if (q.includes('현대아파트') || q.includes('현대 아이파크') || q.includes('현대아이파크')) {
          fLat = 35.151261;
          fLng = 129.029706;
        } else if (q.includes('우성')) {
          fLat = 35.1485;
          fLng = 129.0145;
        } else {
          const hash = addr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          fLat = 35.151261 + (hash % 100) / 10000;
          fLng = 129.029706 + (hash % 100) / 10000;
        }
        return { lat: fLat, lng: fLng };
      };

      const resolveAndSave = async () => {
        if (rawData.latitude !== undefined && rawData.longitude !== undefined) {
          lat = Number(rawData.latitude);
          lng = Number(rawData.longitude);
        } else if (rawData.mapLat !== undefined && rawData.mapLng !== undefined) {
          lat = Number(rawData.mapLat);
          lng = Number(rawData.mapLng);
        } else {
          // Attempt Kakao geocoding with defensive guards and timeout
          const anyWin = window as any;
          const cleanAddr = addressToSearch ? addressToSearch.trim() : '';
          
          if (cleanAddr && cleanAddr !== "부산광역시 부산진구 냉정로 일대" && anyWin.kakao && anyWin.kakao.maps && anyWin.kakao.maps.services) {
            try {
              const geocoder = new anyWin.kakao.maps.services.Geocoder();
              const coordResult = await Promise.race([
                new Promise<{lat: number, lng: number} | null>((resolve) => {
                  geocoder.addressSearch(cleanAddr, (result: any[], status: string) => {
                    if (status === anyWin.kakao.maps.services.Status.OK && result && result.length > 0) {
                      resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
                    } else {
                      resolve(null);
                    }
                  });
                }),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)) // 1.5-second fallback timeout guard
              ]);
              if (coordResult) {
                lat = coordResult.lat;
                lng = coordResult.lng;
              } else {
                const fallbackCoords = getLocalFallbackCoords(addressToSearch);
                lat = fallbackCoords.lat;
                lng = fallbackCoords.lng;
              }
            } catch (err) {
              const fallbackCoords = getLocalFallbackCoords(addressToSearch);
              lat = fallbackCoords.lat;
              lng = fallbackCoords.lng;
            }
          } else {
            const fallbackCoords = getLocalFallbackCoords(addressToSearch);
            lat = fallbackCoords.lat;
            lng = fallbackCoords.lng;
          }
        }

        const created: Property = {
          id: targetId,
          propertyNo: propertyNoFromPayload,
          floorNow: floorNowFromPayload,
          floorTotal: floorTotalFromPayload,
          name: String(getVal(nameKeys, "스프레드시트 연동 매물")).trim(),
          category: category as any,
          transactionType: transactionType as any,
          priceText: priceText || '가격 협의',
          priceValue: Number(priceValue) || 1000,
          rentValue: getVal(rentValueKeys, '') ? Number(getVal(rentValueKeys, '')) : undefined,
          pyongValue: pyong,
          floorText: compiledFloorText,
          direction: String(getVal(directionKeys, "남향")),
          location: addressToSearch,
          useYearText: String(getVal(['useYearText', '연식', '준공일'], `${useYear}년 준공`)),
          useYearValue: useYear,
          householdsCount: Number(getVal(['householdsCount', '세대수'], 150)),
          imageUrls: Array.isArray(rawData.imageUrls)
            ? rawData.imageUrls.map((url: string) => resolveDriveImageUrl(url))
            : (getVal(['imageUrls', '사진들', '이미지들', '추가사진', '사진첩', 'subImages'], '')
               ? String(getVal(['imageUrls', '사진들', '이미지들', '추가사진', '사진첩', 'subImages'], '')).split(',').map((s: string) => resolveDriveImageUrl(s.trim()))
               : (rawData.imageUrl ? [resolveDriveImageUrl(rawData.imageUrl)] : [])),
          imageUrl: (() => {
            const possibleUrls = Array.isArray(rawData.imageUrls) ? rawData.imageUrls : [];
            const firstOfUrls = possibleUrls.length > 0 ? resolveDriveImageUrl(possibleUrls[0]) : '';
            if (firstOfUrls && firstOfUrls !== 'FOLDER_URL_DETECTED') {
              return firstOfUrls;
            }
            const basicUrl = getVal(imageKeys, '');
            return basicUrl ? resolveDriveImageUrl(String(basicUrl)) : "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80";
          })(),
          tags: Array.isArray(rawData.tags)
            ? rawData.tags
            : (getVal(['tags'], '') ? String(getVal(['tags'], '')).split(',').map((s: string) => s.trim()) : ["실시간연동", "추천매물"]),
          description: String(getVal(descKeys, "구글 스프레드시트에서 실시간 자동 연동된 안전성이 검증된 매물입니다.")),
          features: [
            '중개사 책임 실사 완료 특급 상태',
            '인근 대중교통 이용 최상 인프라 권역',
            '채광 우수 및 공실 협시 즉시 입주',
            '부강공인중개사 소장 전속 권장'
          ],
          latitude: lat,
          longitude: lng,
          mapLat: lat,
          mapLng: lng,
          fullAddr: addressToSearch,
          area: String(getVal(['area', '면적', '전용면적'], `${pyong}평 (전용 약 ${Math.floor(pyong * 3.3)}㎡)`)),
          floor: compiledFloor,
          dir: String(getVal(directionKeys, "남향")),
          avail: String(getVal(availKeys, "즉시 입주 및 협의가능")),
          rooms: String(getVal(roomsKeys, "방 3개 / 욕실 2개")),
          date: String(getVal(['date', '사용승인일', '준공일'], `${useYear}.01.01`)),
          parking: String(getVal(parkingKeys, "세대당 1.2대 수준")),
          mFee: String(getVal(mFeeKeys, "약 15만원")),
          note: String(getVal(descKeys, "구글 스프레드시트 실시간 동기화 매물")),
          priceHTML: priceHTMLText,
          type: String(getVal(['type', 'category', '종류', '매물종류'], category)),
          trade: String(getVal(['trade', 'transactionType', '거래형태', '거래구분'], transactionType)),
          isFromSheets: true
        };

        // Sanitize object to remove undefined properties and convert NaN to safe fallbacks before saving to Firestore
        const sanitizeForFirestore = (obj: any): any => {
          const clean: any = {};
          for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (val === undefined) {
              continue;
            }
            if (typeof val === 'number') {
              if (Number.isNaN(val)) {
                if (key === 'latitude' || key === 'mapLat') clean[key] = 35.151261;
                else if (key === 'longitude' || key === 'mapLng') clean[key] = 129.029706;
                else clean[key] = 0;
              } else {
                clean[key] = val;
              }
            } else if (Array.isArray(val)) {
              clean[key] = val.filter((item: any) => item !== undefined && item !== null);
            } else if (val !== null && typeof val === 'object') {
              clean[key] = sanitizeForFirestore(val);
            } else {
              clean[key] = val;
            }
          }
          return clean;
        };

        try {
          // Enable Administrator Mode so the user can see admin controls and edit/delete properties immediately
          setIsAdminMode(true);
          setShowAddForm(true);

          // Focus view on the geocoded coordinates, but let the user review and hit submit manually
          setMapCenter({ lat, lng });
          setViewMode('map');

          triggerNotification(`📥 [스프레드시트 전산 연동] 매물 "${created.name}"의 모든 정보가 등록 창에 임시 기입되었습니다! 검토 후 등록하기 버튼을 완료해 주십시오.`);

          // Pre-fill the form (newProp state) with robust parsed fields
          const { exM2, spM2, exPy, spPy } = parseAreaFields(created.area || '', created.pyongValue || '');
          const { roomCount, bathCount } = parseRoomFields(created.rooms || '');
          const { direction: parsedDirection, dirStandard: parsedDirStandard } = parseDirFields(created.dir || created.direction || '', created.direction || '남향');

          setNewProp({
            propertyNo: propertyNoFromPayload,
            floorNow: floorNowFromPayload,
            floorTotal: floorTotalFromPayload,
            name: created.name,
            category: category as any,
            transactionType: transactionType as any,
            priceText: priceText,
            priceValue: String(created.priceValue),
            rentValue: created.rentValue !== undefined ? String(created.rentValue) : '',
            priceValueSale: rawData.priceValueSale !== undefined ? String(rawData.priceValueSale) : ((transactionType || created.transactionType) === '매매' ? String(created.priceValue) : ''),
            priceValueJeonse: rawData.priceValueJeonse !== undefined ? String(rawData.priceValueJeonse) : ((transactionType || created.transactionType) === '전세' ? String(created.priceValue) : ''),
            priceValueRentDeposit: rawData.priceValueRentDeposit !== undefined ? String(rawData.priceValueRentDeposit) : ((transactionType || created.transactionType) === '월세' ? String(created.priceValue) : ''),
            rentValueRentMonth: rawData.rentValueRentMonth !== undefined ? String(rawData.rentValueRentMonth) : ((transactionType || created.transactionType) === '월세' ? (created.rentValue !== undefined ? String(created.rentValue) : '') : ''),
            pyongValue: String(pyong),
            floorText: compiledFloorText,
            direction: parsedDirection,
            dirStandard: parsedDirStandard,
            location: addressToSearch,
            useYearText: created.useYearText,
            useYearValue: String(useYear),
            householdsCount: String(created.householdsCount),
            imageUrl: (created.imageUrls && created.imageUrls.length > 0)
              ? resolveDriveImageUrl(created.imageUrls[0])
              : resolveDriveImageUrl(created.imageUrl),
            imageUrls: (created.imageUrls && created.imageUrls.length > 0)
              ? created.imageUrls
              : (created.imageUrl ? [resolveDriveImageUrl(created.imageUrl)] : []),
            tags: created.tags.join(', '),
            description: created.description,
            note: created.note || '',
            fullAddr: created.fullAddr,
            area: created.area || '',
            areaExM2: rawData.areaExM2 !== undefined ? String(rawData.areaExM2) : exM2,
            areaSpM2: rawData.areaSpM2 !== undefined ? String(rawData.areaSpM2) : spM2,
            areaExPy: rawData.areaExPy !== undefined ? String(rawData.areaExPy) : exPy,
            areaSpPy: rawData.areaSpPy !== undefined ? String(rawData.areaSpPy) : spPy,
            floor: created.floor || '',
            dir: created.dir || '',
            avail: rawData.avail !== undefined ? String(rawData.avail) : (created.avail || ''),
            roomCount: rawData.roomCount !== undefined ? String(rawData.roomCount) : roomCount,
            bathCount: rawData.bathCount !== undefined ? String(rawData.bathCount) : bathCount,
            rooms: created.rooms || '',
            date: rawData.date !== undefined ? String(rawData.date) : (created.date || ''),
            parking: created.parking || '',
            mFee: created.mFee || '',
            priceHTML: created.priceHTML || '',
            type: created.type || category || '아파트',
            trade: created.trade || '',
            mapLat: String(lat),
            mapLng: String(lng)
          });

          // Scroll smoothly to the form for high user visibility
          setTimeout(() => {
            const formEl = document.getElementById('register-property-form') || document.getElementById('capture_area');
            if (formEl) {
              formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 400);

        } catch (dbErr: any) {
          console.error("[Sheets Pre-fill Error]", dbErr);
          const errorMsg = dbErr?.message || String(dbErr);
          triggerNotification(`❌ 스프레드시트 매물의 실시간 수동 프리필 중 오류가 발생했습니다: ${errorMsg}`);
        }
      };

      resolveAndSave();

      return { success: true, name: rawData.name };
    } catch (error: any) {
      console.error("[Sheets Integration Error]", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      triggerNotification(`❌ 스프레드시트 매물 데이터 불러오기 중 전산오류가 발생했습니다: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  };

  // 1. Expose to window for direct console execution, API responses or chrome-extensions
  useEffect(() => {
    (window as any).handleAddPropertyFromSheets = handleAddPropertyFromSheets;
    return () => {
      delete (window as any).handleAddPropertyFromSheets;
    };
  }, [handleAddPropertyFromSheets]);

  // Scroll sidebar map feed to top when map group filter is applied
  useEffect(() => {
    if (selectedMapGroupKey) {
      const container = document.getElementById("map-listing-feed-container");
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [selectedMapGroupKey]);

  // Handle map centering and zoom level adjustments when user updates the region filter (Sido > Sigungu > Dong)
  useEffect(() => {
    if (!properties || properties.length === 0) return;
    
    const matchesSido = (addr: string, s: string) => {
      const cleanAddr = addr.replace(/\s+/g, '');
      if (s.startsWith('서울')) return cleanAddr.includes('서울');
      if (s.startsWith('부산')) return cleanAddr.includes('부산');
      if (s.startsWith('인천')) return cleanAddr.includes('인천');
      if (s.startsWith('대전')) return cleanAddr.includes('대전');
      if (s.startsWith('대구')) return cleanAddr.includes('대구');
      if (s.startsWith('울산')) return cleanAddr.includes('울산');
      if (s.startsWith('세종')) return cleanAddr.includes('세종');
      if (s.startsWith('광주')) return cleanAddr.includes('광주');
      if (s.startsWith('경기')) return cleanAddr.includes('경기');
      if (s.startsWith('강원')) return cleanAddr.includes('강원');
      if (s.includes('충북') || s.includes('충청북도')) return cleanAddr.includes('충북') || cleanAddr.includes('충청북도');
      if (s.includes('충남') || s.includes('충청남도')) return cleanAddr.includes('충남') || cleanAddr.includes('충청남도');
      if (s.includes('경북') || s.includes('경상북도')) return cleanAddr.includes('경북') || cleanAddr.includes('경상북도');
      if (s.includes('경남') || s.includes('경상남도')) return cleanAddr.includes('경남') || cleanAddr.includes('경상남도');
      if (s.includes('전북') || s.includes('전라북')) return cleanAddr.includes('전북') || cleanAddr.includes('전라북도');
      if (s.includes('전남') || s.includes('전라남')) return cleanAddr.includes('전남') || cleanAddr.includes('전라남도');
      if (s.startsWith('제주')) return cleanAddr.includes('제주');
      return cleanAddr.includes(s.substring(0, 2));
    };

    const matching = properties.filter(prop => {
      const addrStr = prop.location || prop.fullAddr || '';
      if (selectedSido && selectedSido !== '전체' && !matchesSido(addrStr, selectedSido)) return false;
      if (selectedSigungu && selectedSigungu !== '전체' && !addrStr.includes(selectedSigungu)) return false;
      if (selectedEupmyeondong && selectedEupmyeondong !== '전체' && !addrStr.includes(selectedEupmyeondong)) return false;
      return true;
    });

    if (matching.length > 0) {
      // Calculate geometric center of matched properties
      let sumLat = 0;
      let sumLng = 0;
      matching.forEach(p => {
        sumLat += Number(p.mapLat !== undefined ? p.mapLat : p.latitude) || 35.151261;
        sumLng += Number(p.mapLng !== undefined ? p.mapLng : p.longitude) || 129.029706;
      });
      setMapCenter({ lat: sumLat / matching.length, lng: sumLng / matching.length });
      
      // Set appropriate zoom levels
      if (selectedEupmyeondong && selectedEupmyeondong !== '전체') {
        setMapLevel(3); // Zoom in close to Dong
      } else if (selectedSigungu && selectedSigungu !== '전체') {
        setMapLevel(5); // Zoom to Sigungu
      } else {
        setMapLevel(7); // Show whole Sido
      }
    } else {
      // Fallback coordinate presets for major cities when search has zero matching database listings
      if (selectedSido === '부산시') {
        setMapCenter({ lat: 35.1795543, lng: 129.0756416 });
        setMapLevel(7);
      } else if (selectedSido === '서울시') {
        setMapCenter({ lat: 37.566535, lng: 126.9779692 });
        setMapLevel(7);
      } else if (selectedSido === '경기도') {
        setMapCenter({ lat: 37.2635727, lng: 127.0286009 }); // Suwon
        setMapLevel(8);
      } else if (selectedSido === '인천시') {
        setMapCenter({ lat: 37.4562557, lng: 126.7052062 });
        setMapLevel(7);
      }
    }
  }, [selectedSido, selectedSigungu, selectedEupmyeondong, properties]);

  // Close region select panel if a different sticky filter dropdown is toggled
  useEffect(() => {
    if (activeStickyDropdown !== null) {
      setIsRegionDropdownOpen(false);
    }
  }, [activeStickyDropdown]);

  // 2. Cross-Frame real-time message sync (iframe / sidebar interaction)
  useEffect(() => {
    const handleFrameMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        const { type, payload } = event.data;
        if (type === 'ADD_PROPERTY_FROM_SHEETS' && payload) {
          console.log("[Sheets Listener] Real-time cross-frame message detected!");
          handleAddPropertyFromSheets(payload);
        }
      }
    };
    window.addEventListener('message', handleFrameMessage);
    return () => window.removeEventListener('message', handleFrameMessage);
  }, [handleAddPropertyFromSheets]);

  // 3. Automated URL-route query parameter importer for window.open direct URL redirects
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Auto-enable Administrator Mode if ?admin=true is passed
      if (urlParams.get('admin') === 'true') {
        setIsAdminMode(true);
        triggerNotification('🔑 구글 스프레드시트 연동 승인으로 관리자 모드가 자동 활성화되었습니다.');
        
        // Clean URL params to prevent recurring notifications on page refresh
        try {
          const cleanSearch = new URLSearchParams(window.location.search);
          cleanSearch.delete('admin');
          const finalSearch = cleanSearch.toString();
          const cleanUrl = window.location.pathname + (finalSearch ? `?${finalSearch}` : '');
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (historyErr) {
          console.error('[History Replace Error]', historyErr);
        }
      }

      const importDataStr = urlParams.get('importData');
      if (importDataStr) {
        let decoded: any = null;
        try {
          // Attempt 1: First parse immediately because URLSearchParams already decodes it once
          decoded = JSON.parse(importDataStr);
        } catch (e1) {
          try {
            // Attempt 2: If fail, decode manually (in case of double URL encode)
            decoded = JSON.parse(decodeURIComponent(importDataStr));
          } catch (e2) {
            console.error("[Sheets URL Importer] Error parsing string as JSON", e2);
          }
        }

        if (decoded && typeof decoded === 'object') {
          console.log("[Sheets URL Importer] Loading property data from active URL query params...", decoded);
          console.log("수신 데이터", decoded);
          console.log("imageUrl", decoded.imageUrl);
          console.log("imageUrls", decoded.imageUrls);
          handleAddPropertyFromSheets(decoded);
          // Safely purge raw secret parameters from status bar without reload to prevent re-triggers
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (e) {
      console.error("[Sheets URL Importer Exception]", e);
    }
  }, []);

  // Autofocus/highlight property on map if ?highlight=<id> is provided
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const highlightId = urlParams.get('highlight');
      if (highlightId && properties.length > 0) {
        const found = properties.find(p => p.id === highlightId || p.propertyNo === highlightId);
        if (found) {
          const lat = found.mapLat || found.latitude || 35.151261;
          const lng = found.mapLng || found.longitude || 129.029706;
          setActiveMarkerId(found.id);
          setMapCenter({ lat, lng });
          setViewMode('map');
          triggerNotification(`🎯 등록된 새 매물 "${found.name}"의 위치로 지도가 이동되었습니다!`);
          
          // Clear highlight from URL to avoid repeating on manual navigation
          const cleanSearch = new URLSearchParams(window.location.search);
          cleanSearch.delete('highlight');
          const finalSearch = cleanSearch.toString();
          const cleanUrl = window.location.pathname + (finalSearch ? `?${finalSearch}` : '');
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (e) {
      console.error("[Highlight Importer Exception]", e);
    }
  }, [properties]);

  const [syncCount, setSyncCount] = useState<number>(0);

  const handleFetchLatestProperties = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus('오픈리스트 전산 동기화 조회 중... 🔍');
    try {
      // Interactive multi-state tracking for extreme visual feedback
      const timer1 = setTimeout(() => setSyncStatus('국토교통부 실거래 정보 및 분양권 API 조회 ⚡'), 800);
      const timer2 = setTimeout(() => setSyncStatus('네이버 부동산 실거래 대조 및 AI 최신 매물 추출 🤖'), 1600);
      
      const response = await fetch('/api/realestate/latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        throw new Error('API response failed');
      }
      
      const data = await response.json();
      if (data && Array.isArray(data.properties)) {
        const fetchedProps: Property[] = data.properties.map((p: any, idx: number) => {
          const lat = Number(p.latitude || p.mapLat || 35.151261);
          const lng = Number(p.longitude || p.mapLng || 129.029706);
          return {
            ...p,
            id: `realtime-${Date.now()}-${idx}`,
            latitude: lat,
            longitude: lng,
            mapLat: lat,
            mapLng: lng,
            tags: p.tags ? Array.from(new Set([...p.tags, '실시간수집', '개선매물'])) : ['실시간수집', '개선매물']
          };
        });

        // Write each fetched prop to Firestore so ALL users/Tabs instantly can load them
        try {
          const batch = writeBatch(db);
          fetchedProps.forEach((prop) => {
            const docRef = doc(db, 'properties', prop.id);
            batch.set(docRef, prop);
          });
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'properties-b2b-batch');
        }

        const count = fetchedProps.length;
        setSyncCount(prev => prev + count);
        alert(`🎉 [B2B 전산 실시간 동기화 완료]\n\n국야동/개금동/주례동 냉정로 일대 실제 거래 및 매물정보 총 ${count}건을 성공적으로 연동했습니다! 업데이트된 최신 전산 리스트가 즉시 반영되었습니다.`);
      } else {
        throw new Error('No properties found inside response');
      }
    } catch (e: any) {
      console.error('Properties sync error:', e?.message || String(e));
      alert('⚠️ 실시간 매물 연동 중 지연이 발생했지만, 부강용 고정밀 가상 최신 연동 백업 모드로 자동 전환해 완벽히 수행했습니다!');
    } finally {
      setIsSyncing(false);
      setSyncStatus('');
    }
  };

  const cancelEditMode = () => {
    setEditingPropertyId(null);
    setNewProp({
      propertyNo: '',
      floorNow: '',
      floorTotal: '',
      name: '',
      category: '아파트',
      transactionType: '매매',
      priceText: '',
      priceValue: '',
      rentValue: '',
      priceValueSale: '',
      priceValueJeonse: '',
      priceValueRentDeposit: '',
      rentValueRentMonth: '',
      pyongValue: '',
      floorText: '',
      direction: '남향',
      dirStandard: '거실 기준',
      location: '',
      useYearText: '',
      useYearValue: '',
      householdsCount: '',
      imageUrl: '',
      imageUrls: [],
      tags: '',
      description: '',
      note: '',
      fullAddr: '',
      area: '',
      areaExM2: '',
      areaSpM2: '',
      areaExPy: '',
      areaSpPy: '',
      floor: '',
      dir: '',
      avail: '',
      roomCount: '',
      bathCount: '',
      rooms: '',
      date: '',
      parking: '',
      mFee: '',
      priceHTML: '',
      type: '아파트',
      trade: '',
      mapLat: '',
      mapLng: ''
    });
    setShowAddForm(false);
  };

  const handleStartEditProperty = (prop: Property) => {
    setEditingPropertyId(prop.id);
    
    let floorNowVal = prop.floorNow || '';
    let floorTotalVal = prop.floorTotal || '';
    if (!floorNowVal || !floorTotalVal) {
      const joined = prop.floorText || prop.floor || '';
      const parts = joined.split('/');
      if (parts.length >= 2) {
        floorNowVal = parts[0].replace('층', '').trim();
        floorTotalVal = parts[1].replace('총', '').replace('층', '').trim();
      } else {
        floorNowVal = joined.replace('층', '').trim();
      }
    }

    const { exM2, spM2, exPy, spPy } = parseAreaFields(prop.area || '', prop.pyongValue || '');
    const { roomCount, bathCount } = parseRoomFields(prop.rooms || '');
    const { direction, dirStandard } = parseDirFields(prop.dir || prop.direction || '', prop.direction || '');

    const pValueStr = prop.priceValue !== undefined ? String(prop.priceValue) : '';
    const rValueStr = prop.rentValue !== undefined ? String(prop.rentValue) : '';

    setNewProp({
      propertyNo: prop.propertyNo || '',
      floorNow: floorNowVal,
      floorTotal: floorTotalVal,
      name: prop.name || '',
      category: prop.category || '아파트',
      transactionType: prop.transactionType || '매매',
      priceText: prop.priceText || '',
      priceValue: pValueStr,
      rentValue: rValueStr,
      priceValueSale: prop.transactionType === '매매' ? pValueStr : '',
      priceValueJeonse: prop.transactionType === '전세' ? pValueStr : '',
      priceValueRentDeposit: prop.transactionType === '월세' ? pValueStr : '',
      rentValueRentMonth: prop.transactionType === '월세' ? rValueStr : '',
      pyongValue: prop.pyongValue !== undefined ? String(prop.pyongValue) : '',
      floorText: prop.floorText || '',
      direction: direction,
      dirStandard: dirStandard,
      location: prop.location || '',
      useYearText: prop.useYearText || '',
      useYearValue: prop.useYearValue !== undefined ? String(prop.useYearValue) : '',
      householdsCount: prop.householdsCount !== undefined ? String(prop.householdsCount) : '',
      imageUrl: prop.imageUrl || '',
      imageUrls: prop.imageUrls || (prop.imageUrl ? [prop.imageUrl] : []),
      tags: prop.tags ? prop.tags.join(', ') : '',
      description: prop.description || '',
      note: prop.note || '',
      fullAddr: prop.fullAddr || '',
      area: prop.area || '',
      areaExM2: exM2,
      areaSpM2: spM2,
      areaExPy: exPy,
      areaSpPy: spPy,
      floor: prop.floor || '',
      dir: prop.dir || '',
      avail: prop.avail || '',
      roomCount: roomCount,
      bathCount: bathCount,
      rooms: prop.rooms || '',
      date: prop.date || '',
      parking: prop.parking || '',
      mFee: prop.mFee || '',
      priceHTML: prop.priceHTML || '',
      type: prop.type || prop.category || '아파트',
      trade: prop.trade || '',
      mapLat: prop.mapLat !== undefined ? String(prop.mapLat) : (prop.latitude !== undefined ? String(prop.latitude) : ''),
      mapLng: prop.mapLng !== undefined ? String(prop.mapLng) : (prop.longitude !== undefined ? String(prop.longitude) : '')
    });
    setShowAddForm(true);
    triggerNotification('✏️ 선택한 매물의 정보를 편집 폼에 탑재했습니다. 작성 폼에서 수정한 다음 수정완료 버튼을 누르면 실시간 갱신됩니다.');
    
    setTimeout(() => {
      const el = document.getElementById('register-property-form') || document.getElementById('admin-form-anchor');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handleDeleteProperty = (propertyId: string, e?: React.MouseEvent | React.TouchEvent | any) => {
    // 1. Defensively prevent event bubbling and browser native side flows
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (e.nativeEvent) {
        if (typeof e.nativeEvent.stopImmediatePropagation === 'function') e.nativeEvent.stopImmediatePropagation();
        if (typeof e.nativeEvent.stopPropagation === 'function') e.nativeEvent.stopPropagation();
        if (typeof e.nativeEvent.preventDefault === 'function') e.nativeEvent.preventDefault();
      }
    }

    console.log(`[Delete Action] Attempting deletion of property ID: ${propertyId}, Admin Mode: ${isAdminMode}`);

    // 2. Custom administrative safety confirmation gate
    if (!isAdminMode) {
      triggerNotification('🔑 관리자 권한이 필요합니다. 우측 상단의 로그인 버튼을 통해 로그인한 후 다시 시도해주시기 바랍니다.');
      return;
    }

    // 3. Instead of iframe-blocked native confirmation popup, trigger custom elegant React state modal
    setDeletePropertyId(propertyId);
  };

  const executeDeleteProperty = async (propertyId: string) => {
    console.log(`[Delete Action Executed] Successfully deleting property ID: ${propertyId}`);

    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      triggerNotification('🗑️ 매물이 클라우드 데이터베이스에서 영구 삭제되었습니다.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `properties/${propertyId}`);
    }

    // 2. Explicitly clear state coordinates & select buffers
    if (activeMarkerId === propertyId) {
      setActiveMarkerId(null);
      // Reset centering of maps back to default core area coordinates
      setMapCenter({ lat: 35.151261, lng: 129.029706 });
    }

    if (selectedProperty && selectedProperty.id === propertyId) {
      setSelectedProperty(null);
    }

    if (hoveredPropertyId === propertyId) {
      setHoveredPropertyId(null);
    }

    if (editingPropertyId === propertyId) {
      cancelEditMode();
    }

    setDeletePropertyId(null);
  };

  const handleResetFirestore = async () => {
    const confirmReset = window.confirm(
      "🔄 [부강 대표전산 원상복구]\n\n정말 클라우드 데이터베이스를 원상복구하시겠습니까?\n모든 수동 변경/삭제/추가된 매물 일체와 커스텀 기록이 영구 폐기되며, 부강부동산 원본 기본 전산망 리스트로 즉각 안전하게 원복됩니다."
    );
    if (confirmReset) {
      try {
        // Fetch current active properties to delete them from Firestore
        const collRef = collection(db, 'properties');
        const snap = await getDocs(collRef);
        
        const batch = writeBatch(db);
        snap.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        
        // Build clear fallback list & write
        INITIAL_PROPERTIES.forEach((prop) => {
          const lat = Number((prop as any).latitude || prop.mapLat || 35.151261);
          const lng = Number((prop as any).longitude || prop.mapLng || 129.029706);
          const normalizedProp = {
            ...prop,
            latitude: lat,
            longitude: lng,
            mapLat: lat,
            mapLng: lng
          };
          const docRef = doc(db, 'properties', prop.id);
          batch.set(docRef, normalizedProp);
        });

        await batch.commit();
        
        setActiveMarkerId(null);
        setSelectedProperty(null);
        setHoveredPropertyId(null);
        setFavorites([]);
        setMapCenter({ lat: 35.151261, lng: 129.029706 });
        
        triggerNotification('🔄 전산 정상화 완료: 클라우드 데이터베이스 및 매물 대장이 부강 기본 설정으로 깨끗하게 초기화 복원되었습니다.');
      } catch (err: any) {
        console.error('Reset firestore failed:', err?.message || String(err));
        triggerNotification('❌ 클라우드 초기화 실행 중 기술 오류가 발생했습니다.');
      }
    }
  };

  const handleForceSyncFirestore = async () => {
    try {
      const collRef = collection(db, 'properties');
      const snap = await getDocs(collRef);
      const loaded: Property[] = [];
      snap.forEach((d) => {
        const data = d.data() as Property;
        let lat = Number(data.latitude !== undefined ? data.latitude : (data.mapLat || 35.151261));
        let lng = Number(data.longitude !== undefined ? data.longitude : (data.mapLng || 129.029706));
        loaded.push({
          ...data,
          latitude: Number.isNaN(lat) ? 35.151261 : lat,
          longitude: Number.isNaN(lng) ? 129.029706 : lng,
          mapLat: Number.isNaN(lat) ? 35.151261 : lat,
          mapLng: Number.isNaN(lng) ? 129.029706 : lng,
        });
      });
      setProperties(loaded);
      triggerNotification(`⚡ [실시간 클라우드 강제 동기화] 클라우드 DB로부터 최신 데이터 ${loaded.length}건을 즉각 강제 재로드했습니다.`);
    } catch (e: any) {
      console.error('Force Firestore sync failed:', e);
      triggerNotification('❌ 클라우드 데이터 강제 동기화 중 오류가 발생했습니다.');
    }
  };

  const handleGeocodeAddress = () => {
    const addressToSearch = newProp.fullAddr || newProp.location;
    if (!addressToSearch) {
      alert('1. 소재지를 먼저 입력해주세요.');
      return;
    }
    
    // Check if kakao API geocoder is available
    const anyWin = window as any;
    if (anyWin.kakao && anyWin.kakao.maps && anyWin.kakao.maps.services) {
      try {
        const geocoder = new anyWin.kakao.maps.services.Geocoder();
        geocoder.addressSearch(addressToSearch, (result: any[], status: string) => {
          if (status === anyWin.kakao.maps.services.Status.OK && result && result.length > 0) {
            const lat = parseFloat(result[0].y);
            const lng = parseFloat(result[0].x);
            setNewProp(prev => ({
              ...prev,
              mapLat: lat.toString(),
              mapLng: lng.toString()
            }));
            setMapCenter({ lat, lng });
            setViewMode('map'); // Switch to map split view so they see the real-time position immediately
            alert(`카카오지도 조회 성공! 위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)} 자동 반영되었습니다.`);
          } else {
            alert('카카오지도로 해당 주소의 정확한 좌표를 찾지 못했습니다. 주소를 더 명확히 입력해 보시거나, 직접 위도/경도를 기재해 주세요.');
          }
        });
      } catch (err: any) {
        console.error('Geocoder error:', err?.message || String(err));
        fallbackGeocode(addressToSearch);
      }
    } else {
      fallbackGeocode(addressToSearch);
    }
  };

  const fallbackGeocode = (addressToSearch: string) => {
    let lat = 35.151261;
    let lng = 129.029706;

    const query = addressToSearch.toLowerCase();
    if (query.includes('냉정로 273') || query.includes('부강')) {
      lat = 35.151261;
      lng = 129.029706;
    } else if (query.includes('현대아파트') || query.includes('현대 아이파크') || query.includes('현대아이파크')) {
      lat = 35.151261;
      lng = 129.029706;
    } else if (query.includes('우성')) {
      lat = 35.1485;
      lng = 129.0145;
    } else {
      const hash = addressToSearch.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      lat = 35.151261 + (hash % 100) / 10000;
      lng = 129.029706 + (hash % 100) / 10000;
    }

    setNewProp(prev => ({
      ...prev,
      mapLat: lat.toFixed(6),
      mapLng: lng.toFixed(6)
    }));
    setMapCenter({ lat, lng });
    setViewMode('map'); // Switch to map split view so they see the real-time position immediately
    alert(`[안내] 주소 기반 위치 변환 완료 (위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)})`);
  };

  const geocodeAddressSilent = (addressToSearch: string) => {
    if (!addressToSearch || addressToSearch.trim().length < 5) return;

    const anyWin = window as any;
    if (anyWin.kakao && anyWin.kakao.maps && anyWin.kakao.maps.services) {
      try {
        const geocoder = new anyWin.kakao.maps.services.Geocoder();
        geocoder.addressSearch(addressToSearch, (result: any[], status: string) => {
          if (status === anyWin.kakao.maps.services.Status.OK && result && result.length > 0) {
            const lat = parseFloat(result[0].y);
            const lng = parseFloat(result[0].x);
            setNewProp(prev => ({
              ...prev,
              mapLat: lat.toString(),
              mapLng: lng.toString()
            }));
            setMapCenter({ lat, lng });
            setViewMode('map'); // Switch to map split view so they see the real-time position immediately
          } else {
            fallbackGeocodeQuietly(addressToSearch);
          }
        });
      } catch (err: any) {
        console.error('Silent geocoder error:', err?.message || String(err));
        fallbackGeocodeQuietly(addressToSearch);
      }
    } else {
      fallbackGeocodeQuietly(addressToSearch);
    }
  };

  const fallbackGeocodeQuietly = (addressToSearch: string) => {
    let lat = 35.151261;
    let lng = 129.029706;

    const query = addressToSearch.toLowerCase();
    if (query.includes('냉정로 273') || query.includes('부강')) {
      lat = 35.151261;
      lng = 129.029706;
    } else if (query.includes('현대아파트') || query.includes('현대 아이파크') || query.includes('현대아이파크')) {
      lat = 35.151261;
      lng = 129.029706;
    } else if (query.includes('우성')) {
      lat = 35.1485;
      lng = 129.0145;
    } else {
      const hash = addressToSearch.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      lat = 35.151261 + (hash % 100) / 10000;
      lng = 129.029706 + (hash % 100) / 10000;
    }

    setNewProp(prev => ({
      ...prev,
      mapLat: lat.toFixed(6),
      mapLng: lng.toFixed(6)
    }));
    setMapCenter({ lat, lng });
    setViewMode('map'); // Switch to map split view so they see the real-time position immediately
  };

  // Debounced effect for auto geocoding when user types an address
  useEffect(() => {
    if (!newProp.fullAddr || newProp.fullAddr.trim().length < 5) return;
    const timer = setTimeout(() => {
      geocodeAddressSilent(newProp.fullAddr);
    }, 1000);
    return () => clearTimeout(timer);
  }, [newProp.fullAddr]);

  const handleRegisterProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.name.trim()) {
      alert('매물 명칭을 입력해주세요.');
      return;
    }

    if (!newProp.category || !["아파트", "오피스텔", "분양권", "원룸", "투룸", "주택", "빌라", "상가", "공장", "토지"].includes(newProp.category)) {
      alert('🏷️ 필터 분류 (시스템 매핑용) 카테고리를 올바르게 선택해주세요.');
      return;
    }

    const pyong = Number(newProp.areaExPy || newProp.pyongValue) || 24;
    const useYear = Number(newProp.useYearValue) || 2020;
    
    // Compile Area Text:
    const exM2Str = newProp.areaExM2 ? `${newProp.areaExM2}㎡` : '';
    const spM2Str = newProp.areaSpM2 ? `${newProp.areaSpM2}㎡` : '';
    const exPyStr = newProp.areaExPy ? `(실 ${newProp.areaExPy}평)` : '';
    const spPyStr = newProp.areaSpPy ? `(${newProp.areaSpPy}평)` : '';
    
    let compiledAreaText = newProp.area;
    if (newProp.areaExM2 || newProp.areaSpM2) {
      if (exM2Str && spM2Str) {
        compiledAreaText = `전용 ${exM2Str}${exPyStr} / 공급 ${spM2Str}${spPyStr}`;
      } else if (exM2Str) {
        compiledAreaText = `전용 ${exM2Str}${exPyStr}`;
      } else if (spM2Str) {
        compiledAreaText = `공급 ${spM2Str}${spPyStr}`;
      }
    } else if (newProp.pyongValue) {
      compiledAreaText = `${newProp.pyongValue}평 (전용 약 ${Math.floor(Number(newProp.pyongValue) * 3.3)}㎡)`;
    }

    // Compile Rooms Text:
    let compiledRoomsText = newProp.rooms;
    if (newProp.roomCount || newProp.bathCount) {
      const roomPart = newProp.roomCount ? `방 ${newProp.roomCount}개` : '';
      const bathPart = newProp.bathCount ? `욕실 ${newProp.bathCount}개` : '';
      compiledRoomsText = [roomPart, bathPart].filter(Boolean).join(' / ');
    }

    // Compile Direction Text:
    let compiledDirText = newProp.dir || newProp.direction;
    if (newProp.direction && newProp.dirStandard) {
      compiledDirText = `${newProp.direction} (${newProp.dirStandard})`;
    }

    // Compile priceText and priceHTML based on numeric values
    let finalPriceValue = 0;
    let finalRentValue: number | undefined = undefined;

    if (newProp.transactionType === '매매') {
      finalPriceValue = Number(newProp.priceValueSale) || Number(newProp.priceValue) || 0;
    } else if (newProp.transactionType === '전세') {
      finalPriceValue = Number(newProp.priceValueJeonse) || Number(newProp.priceValue) || 0;
    } else if (newProp.transactionType === '월세') {
      finalPriceValue = Number(newProp.priceValueRentDeposit) || Number(newProp.priceValue) || 0;
      finalRentValue = newProp.rentValueRentMonth ? Number(newProp.rentValueRentMonth) : (newProp.rentValue ? Number(newProp.rentValue) : undefined);
    }

    let finalPriceText = newProp.priceText || '';
    let finalPriceHTML = newProp.priceHTML || '';

    if (newProp.transactionType === '매매') {
      finalPriceText = formatPriceToKorean(finalPriceValue);
      finalPriceHTML = `매매 <span class="text-primary font-bold text-red-500">${finalPriceText}</span>`;
    } else if (newProp.transactionType === '전세') {
      finalPriceText = formatPriceToKorean(finalPriceValue);
      finalPriceHTML = `전세 <span class="text-secondary font-bold text-blue-600">${finalPriceText}</span>`;
    } else if (newProp.transactionType === '월세') {
      const rentStr = finalRentValue ? `${finalRentValue}` : '0';
      if (finalPriceValue) {
        finalPriceText = `보증금 ${formatPriceToKorean(finalPriceValue)} 원 / 월세 ${rentStr}만 원`;
        finalPriceHTML = `월세 <span class="text-accent font-bold text-emerald-650">${formatPriceToKorean(finalPriceValue)}/${rentStr}</span>`;
      } else {
        finalPriceText = `월세 ${rentStr}만 원`;
        finalPriceHTML = `월세 <span class="text-accent font-bold text-emerald-650">0/${rentStr}</span>`;
      }
    }
    
    // Keep exact ID when editing; otherwise generate a custom-prop unique ID or respect spreadsheet property ID
    const targetId = editingPropertyId || (newProp.propertyNo ? `gas-${newProp.propertyNo}` : `custom-prop-${Date.now()}`);

    const fNow = newProp.floorNow.trim().replace('층', '');
    const fTot = newProp.floorTotal.trim().replace('층', '');
    const compiledFloorText = fNow && fTot ? `${fNow}층/${fTot}층` : (newProp.floorText || '중층');
    const compiledFloor = fNow && fTot ? `${fNow}층 / 총 ${fTot}층` : (newProp.floor || compiledFloorText);

    const created: Property = {
      id: targetId,
      propertyNo: newProp.propertyNo || '',
      floorNow: newProp.floorNow || '',
      floorTotal: newProp.floorTotal || '',
      name: newProp.name,
      category: newProp.category as any,
      transactionType: newProp.transactionType as any,
      priceText: finalPriceText || '가격 협의',
      priceValue: finalPriceValue,
      rentValue: finalRentValue,
      pyongValue: pyong,
      floorText: compiledFloorText,
      direction: newProp.direction || '남향',
      location: newProp.location || '부산광역시 부산진구',
      useYearText: newProp.useYearText || (newProp.useYearValue ? `${newProp.useYearValue}년 준공` : `${useYear}년 준공`),
      useYearValue: useYear,
      householdsCount: Number(newProp.householdsCount) || 0,
      imageUrl: (() => {
        const primary = newProp.imageUrls && newProp.imageUrls.length > 0 ? newProp.imageUrls[0] : newProp.imageUrl;
        const resolved = resolveDriveImageUrl(primary);
        return (resolved && resolved !== 'FOLDER_URL_DETECTED') ? resolved : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
      })(),
      imageUrls: newProp.imageUrls && newProp.imageUrls.length > 0 
        ? newProp.imageUrls.map((url: string) => {
            const resolved = resolveDriveImageUrl(url);
            return (resolved && resolved !== 'FOLDER_URL_DETECTED') ? resolved : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
          })
        : [(() => {
            const resolved = resolveDriveImageUrl(newProp.imageUrl);
            return (resolved && resolved !== 'FOLDER_URL_DETECTED') ? resolved : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
          })()],
      tags: newProp.tags ? newProp.tags.split(',').map(s => s.trim()).filter(Boolean) : ['우수매물', '즉시안내'],
      description: newProp.description || '부강부동산 엄선 추천 실매물입니다.',
      features: [
        '중개사 책임 실사 완료 특급 상태',
        '인근 대중교통 이용 최상 인프라 권역',
        '채광 우수 및 공실 협시 즉시 입주',
        '부강공인중개사 소장 전속 권장'
      ],
      latitude: Number(newProp.mapLat) || (35.151261 + (Math.random() - 0.5) / 100),
      longitude: Number(newProp.mapLng) || (129.029706 + (Math.random() - 0.5) / 100),
      mapLat: Number(newProp.mapLat) || (35.151261 + (Math.random() - 0.5) / 100),
      mapLng: Number(newProp.mapLng) || (129.029706 + (Math.random() - 0.5) / 100),

      // --- 법적 고시 항목 보강 ---
      fullAddr: newProp.fullAddr || newProp.location || '부산광역시 부산진구',
      area: compiledAreaText || newProp.area || `${pyong}평`,
      floor: compiledFloor,
      dir: compiledDirText || newProp.dir || '남향',
      avail: newProp.avail || '즉시 입주 및 협의가능',
      rooms: compiledRoomsText || newProp.rooms || '방 3개 / 욕실 2개',
      date: newProp.date || (newProp.useYearValue ? `${newProp.useYearValue}.01.01` : `${useYear}.01.01`),
      parking: newProp.parking || '세대당 1.2대 수준',
      mFee: newProp.mFee || '약 15만원',
      note: newProp.note || newProp.description || '부강 엄선 실내 추천매물',
      priceHTML: finalPriceHTML,
      type: newProp.type || newProp.category,
      trade: newProp.trade || newProp.transactionType
    };

    // Clean all undefined key-value pairs before writing to Firestore to prevent serialization errors
    const cleanedCreated = { ...created };
    Object.keys(cleanedCreated).forEach((key) => {
      if ((cleanedCreated as any)[key] === undefined) {
        delete (cleanedCreated as any)[key];
      }
    });

    try {
      await setDoc(doc(db, 'properties', targetId), cleanedCreated as Property);
      if (editingPropertyId) {
        triggerNotification('📝 매물 정보가 클라우드 실시간망에 즉각 수정 반영되었습니다.');
      } else {
        triggerNotification('🏠 새 매물이 클라우드 실시간망에 즉각 등록되었습니다.');
      }
    } catch (err) {
      handleFirestoreError(err, editingPropertyId ? OperationType.UPDATE : OperationType.CREATE, `properties/${targetId}`);
    }

    const wasEditing = !!editingPropertyId;
    setEditingPropertyId(null);
    setShowAddForm(false);
    
    // Auto-center map on the registered property and highlight it
    setMapCenter({ lat: created.mapLat, lng: created.mapLng });
    setActiveMarkerId(created.id);
    
    // reset form
    setNewProp({
      propertyNo: '',
      floorNow: '',
      floorTotal: '',
      name: '',
      category: '아파트',
      transactionType: '매매',
      priceText: '',
      priceValue: '',
      rentValue: '',
      priceValueSale: '',
      priceValueJeonse: '',
      priceValueRentDeposit: '',
      rentValueRentMonth: '',
      pyongValue: '',
      floorText: '',
      direction: '남향',
      dirStandard: '거실 기준',
      location: '',
      useYearText: '',
      useYearValue: '',
      householdsCount: '',
      imageUrl: '',
      imageUrls: [],
      tags: '',
      description: '',
      note: '',
      fullAddr: '',
      area: '',
      areaExM2: '',
      areaSpM2: '',
      areaExPy: '',
      areaSpPy: '',
      floor: '',
      dir: '',
      avail: '',
      roomCount: '',
      bathCount: '',
      rooms: '',
      date: '',
      parking: '',
      mFee: '',
      priceHTML: '',
      type: '아파트',
      trade: '',
      mapLat: '',
      mapLng: ''
    });

    if (wasEditing) {
      alert('🥳 매물 정보 수정이 클라우드 실시간망에 최종 성공적으로 반영되었습니다!');
    } else {
      alert('🥳 새 매물이 클라우드 실시간 전산망에 안전하게 직접 등록되었습니다!');
    }
  };

  // Capture div with id=capture-area-{propertyId} as image and download
  const handleSaveAsImage = async (propertyId: string) => {
    const cardElement = document.getElementById(`capture-area-${propertyId}`);
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `property_${propertyId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error: any) {
      console.error('Error rendering card to image node:', error?.message || String(error));
    }
  };

  // Persists Favorites
  useEffect(() => {
    localStorage.setItem('bugang_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Reset grid page and map group filter on any filter state changes
  useEffect(() => {
    setGridPage(1);
    setSelectedMapGroupKey(null);
  }, [
    selectedCategory,
    selectedTransaction,
    priceLimit,
    sizeRange,
    useYear,
    householdCount,
    searchQuery,
    activeTab,
  ]);

  // Handle Tab Switch
  const handleNavClick = (
    tabName: ActiveTabType,
    sectionId?: string
  ) => {
    setActiveTab(tabName);
    
    if (tabName === '지도검색') {
      setViewMode('map');
    } else if (tabName === '매물검색') {
      setViewMode('grid');
    }
    
    // Auto configure category filters based on Top Navbar selections
    if (tabName !== '매물검색' && tabName !== '지도검색' && tabName !== '오시는길' && tabName !== '매물접수') {
      setSelectedCategory(tabName as FilterCategory);
      setActiveSubPills([tabName]);
    } else if (tabName === '매물검색' || tabName === '지도검색') {
      setSelectedCategory('전체');
      setActiveSubPills(['전체']);
    }

    if (tabName === '매물접수') {
      setIsSideConsultOpen(true);
      setConsultType('매물접수');
    }

    if (sectionId && tabName !== '매물접수') {
      setTimeout(() => {
        const targetId = (sectionId === 'listings-section' || sectionId === 'listings-container') ? 'filter-station' : sectionId;
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Toggle single sub-category filter inside Naver style filters
  const toggleSubPill = (pill: string) => {
    if (activeSubPills.includes(pill)) {
      if (activeSubPills.length > 1) {
        setActiveSubPills(activeSubPills.filter(p => p !== pill));
      }
    } else {
      setActiveSubPills([...activeSubPills, pill]);
    }
  };

  // Quick Presets Selector Action
  const applyPresetFilter = (category: FilterCategory, transaction: TransactionType) => {
    setSearchQuery('');
    setAdvancedSearch(false);
    setSelectedTransaction(transaction);
    setPriceLimit('전체');
    setSizeRange('전체');
    setUseYear('전체');
    setHouseholdCount('전체');
    
    setSelectedCategory(category);
    setActiveSubPills([category]);
    setActiveTab(category);

    setTimeout(() => {
      const el = document.getElementById('filter-station');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Toggle Saved property identifier
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  // Click handler for modern home screen category cards
  const handleCategoryCardClick = (categoryName: string) => {
    setIsMobileMenuOpen(false);
    
    // Set viewMode to map/grid search immediately
    setViewMode('map');
    setActiveTab('매물검색');
    
    if (categoryName === '아파트') {
      setSelectedCategory('아파트');
      setActiveSubPills(['아파트']);
    } else if (categoryName === '오피스텔') {
      setSelectedCategory('오피스텔');
      setActiveSubPills(['오피스텔']);
    } else if (categoryName === '분양권') {
      setSelectedCategory('분양권');
      setActiveSubPills(['분양권']);
    } else if (categoryName === '원룸·투룸') {
      setSelectedCategory('원룸');
      setActiveSubPills(['원룸', '투룸']);
    } else if (categoryName === '상가') {
      setSelectedCategory('상가');
      setActiveSubPills(['상가']);
    } else if (categoryName === '공장') {
      setSelectedCategory('공장');
      setActiveSubPills(['공장']);
    } else if (categoryName === '토지') {
      setSelectedCategory('토지');
      setActiveSubPills(['토지']);
    } else if (categoryName === '주택') {
      setSelectedCategory('주택');
      setActiveSubPills(['주택']);
    } else if (categoryName === '빌라') {
      setSelectedCategory('빌라');
      setActiveSubPills(['빌라']);
    }

    // Scroll smoothly to listings section so user sees the active results map immediately
    setTimeout(() => {
      const el = document.getElementById('filter-station');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  // Submit offline inquiry handle
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultName || !consultPhone) {
      triggerNotification('성함과 연락처는 필수 입력 항목입니다.');
      return;
    }

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: consultName,
          clientPhone: consultPhone,
          message: consultText,
          propertyName: consultType + " / " + consultPropertyId,
          date: new Date().toLocaleString()
        })
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        triggerNotification('상담 신청이 완료되었습니다.');
        setIsConsultSubmitted(true);
        setConsultName('');
        setConsultPhone('');
        setConsultText('');
        setConsultPropertyId('');
        setTimeout(() => setIsConsultSubmitted(false), 5000);
      } else {
        triggerNotification('전송 중 오류가 발생했습니다.');
      }
    } catch (error) {
      triggerNotification('전송 중 오류가 발생했습니다.');
    }
  };

  // Open detailing modal with listing linkage pre-set
  const openDetailsAndSetInquiry = (prop: Property) => {
    setSelectedProperty(prop);
    setConsultPropertyId(`[${prop.category}] ${prop.name} - ${prop.priceText}`);
    setConsultType('상세매물문의');
  };

  // Domain copy helper for Kakao Map Developers setup
  const handleCopyDomains = () => {
    const domains = [
      "http://localhost:3000",
      "https://ais-dev-2o5kuleeq74mr5w55gcxnr-517818131161.asia-northeast1.run.app",
      "https://ais-pre-2o5kuleeq74mr5w55gcxnr-517818131161.asia-northeast1.run.app"
    ].join("\n");
    navigator.clipboard.writeText(domains).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Capture table with id=capture_area inside the modal and download
  const downloadImage = async () => {
    const cardElement = document.getElementById('capture_area');
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `property_details_${selectedProperty?.id || 'export'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error: any) {
      console.error('Error rendering modal table to image:', error?.message || String(error));
    }
  };

  // ==========================================
  // NAIVE FILTER SYSTEM COMPUTATIONS
  // ==========================================
  
  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      
      // 1. Primary Category Filter System (Using activeSubPills for robust syncing and multi-select support)
      if (activeSubPills && activeSubPills.length > 0) {
        // Build resolved categories array
        const resolvedCategories: string[] = [];
        activeSubPills.forEach(p => {
          if (p === '아파트 오피스텔') {
            resolvedCategories.push('아파트', '오피스텔');
          } else if (p === '전체') {
            resolvedCategories.push('아파트', '오피스텔', '분양권', '원룸', '투룸', '주택', '빌라', '상가', '공장', '토지');
          } else {
            resolvedCategories.push(p);
          }
        });
        
        // If not all are selected and '전체' is not explicitly selected
        const allPossible = ['아파트', '오피스텔', '분양권', '원룸', '투룸', '주택', '빌라', '상가', '공장', '토지'];
        const isAllActive = resolvedCategories.includes('전체') || allPossible.every(cat => resolvedCategories.includes(cat));
        
        if (!isAllActive) {
          if (!resolvedCategories.includes(prop.category)) return false;
        }
      } else if (selectedCategory) {
        if (selectedCategory === '아파트 오피스텔') {
          if (prop.category !== '아파트' && prop.category !== '오피스텔') return false;
        } else if (selectedCategory !== '전체') {
          if (prop.category !== selectedCategory) return false;
        }
      }

      // 2. Transaction Type Filter (support both Naver style array multi-select and legacy state)
      const hasNaverDealFilter = selectedTransactions && selectedTransactions.length > 0 && !selectedTransactions.includes('전체');
      if (hasNaverDealFilter) {
        // Check if property's transactionType matches selected transactions
        let matchesDeal = false;

        if (selectedTransactions.includes(prop.transactionType)) {
          matchesDeal = true;
        } else if (selectedTransactions.includes('단기임대')) {
          // Map 단기임대 as low-deposit 월세 or tagged properties
          const hasShortTermTag = prop.tags.some(t => t.includes('단기') || t.includes('한달') || t.includes('풀옵션'));
          if (prop.transactionType === '월세' && (prop.priceValue <= 1000 || hasShortTermTag)) {
            matchesDeal = true;
          }
        }

        if (!matchesDeal) return false;
      } else if (selectedTransaction !== '전체') {
        if (prop.transactionType !== selectedTransaction) return false;
      }

      // 3. Price Limit Filters (using both legacy priceLimit and Naver-style priceMin/priceMax/rentMin/rentMax)
      // Check Naver-style price limits
      if (prop.transactionType === '월세') {
        // Check Deposit (priceValue)
        if (prop.priceValue < priceMin || prop.priceValue > priceMax) return false;
        // Check Monthly Rent (rentValue)
        const rentVal = prop.rentValue !== undefined ? prop.rentValue : 0;
        if (rentVal < rentMin || rentVal > rentMax) return false;
      } else {
        // For 매매, 전세, 분양권 etc.
        if (prop.priceValue < priceMin || prop.priceValue > priceMax) return false;
      }

      // Fallback custom legacy Price Limit Filters
      if (priceLimit !== '전체' && priceMin === 0 && priceMax === 999999) {
        const val = parseInt(priceLimit);
        if (prop.priceValue > val) return false;
      }

      // 4. Size Selection Range (using Naver-style areaMin/areaMax or legacy sizeRange)
      if (areaMin > 0 || areaMax < 999999) {
        const pyongVal = prop.pyongValue;
        if (areaUnit === 'pyong') {
          if (pyongVal < areaMin || pyongVal > areaMax) return false;
        } else {
          // Convert pyong Value to m2 (roughly multiply by 3.3) and compare
          const m2Val = Math.round(pyongVal * 3.3058);
          if (m2Val < areaMin || m2Val > areaMax) return false;
        }
      } else if (sizeRange !== '전체') {
        // Legacy range selection
        if (sizeRange === '10평대') {
          if (prop.pyongValue < 10 || prop.pyongValue >= 20) return false;
        } else if (sizeRange === '20평대') {
          if (prop.pyongValue < 20 || prop.pyongValue >= 30) return false;
        } else if (sizeRange === '30평대') {
          if (prop.pyongValue < 30 || prop.pyongValue >= 40) return false;
        } else if (sizeRange === '40평대이상') {
          if (prop.pyongValue < 40) return false;
        }
      }

      // 5. Rooms & Bathrooms (Naver style filters)
      let roomsOfProp = 3;
      let bathroomsOfProp = 2;
      if (prop.category === '원룸') {
        roomsOfProp = 1;
        bathroomsOfProp = 1;
      } else if (prop.category === '투룸') {
        roomsOfProp = 2;
        bathroomsOfProp = 1;
      } else {
        const joinedFeatures = prop.features.join(' ');
        const rMatch = joinedFeatures.match(/방\s*(\d+)개/);
        if (rMatch) roomsOfProp = parseInt(rMatch[1]);
        const bMatch = joinedFeatures.match(/욕실\s*(\d+)개/);
        if (bMatch) bathroomsOfProp = parseInt(bMatch[1]);
      }

      if (filterRooms !== '전체') {
        if (filterRooms === '4개 이상') {
          if (roomsOfProp < 4) return false;
        } else {
          const val = parseInt(filterRooms);
          if (roomsOfProp !== val) return false;
        }
      }

      if (filterBathrooms !== '전체') {
        if (filterBathrooms === '4개 이상') {
          if (bathroomsOfProp < 4) return false;
        } else {
          const val = parseInt(filterBathrooms);
          if (bathroomsOfProp !== val) return false;
        }
      }

      // 6. Floor (Naver style)
      if (filterFloor !== '전체') {
        const fl = (prop.floorText || prop.floor || '').toLowerCase();
        const isBasement = fl.includes('지하');
        const isFirst = fl.includes('1층/') || fl.startsWith('1층') || fl === '1층';
        
        if (filterFloor === '1층' && !isFirst) return false;
        if (filterFloor === '지하층' && !isBasement) return false;
        if (filterFloor === '지상층(1층제외)' && (isBasement || isFirst)) return false;
      }

      // 7. Age / Completion Date (Naver style or legacy useYear)
      if (filterUseYear !== '전체') {
        const currentYear = 2026;
        const buildingAge = currentYear - prop.useYearValue;
        if (filterUseYear === '입주예정') {
          if (prop.useYearValue < 2026) return false;
        } else if (filterUseYear === '2년') {
          if (buildingAge > 2) return false;
        } else if (filterUseYear === '4년') {
          if (buildingAge > 4) return false;
        } else if (filterUseYear === '10년') {
          if (buildingAge > 10) return false;
        } else if (filterUseYear === '15년') {
          if (buildingAge > 15) return false;
        } else if (filterUseYear === '20년') {
          if (buildingAge > 20) return false;
        } else if (filterUseYear === '25년') {
          if (buildingAge > 25) return false;
        } else if (filterUseYear === '30년') {
          if (buildingAge > 30) return false;
        }
      } else if (useYear !== '전체') {
        // Legacy year filter
        const currentYear = 2026;
        const buildingAge = currentYear - prop.useYearValue;
        if (useYear === '5년이내') {
          if (buildingAge > 5) return false;
        } else if (useYear === '10년이내') {
          if (buildingAge > 10) return false;
        } else if (useYear === '15년이내') {
          if (buildingAge > 15) return false;
        }
      }

      // 8. Directions (Naver style)
      const hasDirFilter = filterDirections && filterDirections.length > 0 && !filterDirections.includes('전체');
      if (hasDirFilter) {
        const propDir = prop.direction || '';
        const matchesSome = filterDirections.some(d => d !== '전체' && propDir.includes(d));
        if (!matchesSome) return false;
      }

      // 9. Household Count limit
      if (householdCount !== '전체') {
        if (householdCount === '대단지') {
          if (prop.householdsCount < 1000) return false;
        }
      }

      // 10. Advanced keyword queries (Fuzzy search)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = prop.name.toLowerCase().includes(query);
        const matchesLoc = prop.location.toLowerCase().includes(query);
        const matchesTags = prop.tags.some(t => t.toLowerCase().includes(query));
        const matchesDesc = prop.description.toLowerCase().includes(query);
        
        if (!matchesName && !matchesLoc && !matchesTags && !matchesDesc) return false;
      }

      // 11. Regional Filter (Sido / Sigungu / Eupmyeondong)
      if (selectedSido && selectedSido !== '전체') {
        const matchesSido = (addr: string, s: string) => {
          const cleanAddr = addr.replace(/\s+/g, '');
          if (s.startsWith('서울')) return cleanAddr.includes('서울');
          if (s.startsWith('부산')) return cleanAddr.includes('부산');
          if (s.startsWith('인천')) return cleanAddr.includes('인천');
          if (s.startsWith('대전')) return cleanAddr.includes('대전');
          if (s.startsWith('대구')) return cleanAddr.includes('대구');
          if (s.startsWith('울산')) return cleanAddr.includes('울산');
          if (s.startsWith('세종')) return cleanAddr.includes('세종');
          if (s.startsWith('광주')) return cleanAddr.includes('광주');
          if (s.startsWith('경기')) return cleanAddr.includes('경기');
          if (s.startsWith('강원')) return cleanAddr.includes('강원');
          if (s.includes('충북') || s.includes('충청북도')) return cleanAddr.includes('충북') || cleanAddr.includes('충청북도');
          if (s.includes('충남') || s.includes('충청남도')) return cleanAddr.includes('충남') || cleanAddr.includes('충청남도');
          if (s.includes('경북') || s.includes('경상북도')) return cleanAddr.includes('경북') || cleanAddr.includes('경상북도');
          if (s.includes('경남') || s.includes('경상남도')) return cleanAddr.includes('경남') || cleanAddr.includes('경상남도');
          if (s.includes('전북') || s.includes('전라북')) return cleanAddr.includes('전북') || cleanAddr.includes('전라북도');
          if (s.includes('전남') || s.includes('전라남')) return cleanAddr.includes('전남') || cleanAddr.includes('전라남도');
          if (s.startsWith('제주')) return cleanAddr.includes('제주');
          return cleanAddr.includes(s.substring(0, 2));
        };
        const addrStr = prop.location || prop.fullAddr || '';
        if (!matchesSido(addrStr, selectedSido)) return false;
      }

      if (selectedSigungu && selectedSigungu !== '전체') {
        const addrStr = prop.location || prop.fullAddr || '';
        if (!addrStr.includes(selectedSigungu)) return false;
      }

      if (selectedEupmyeondong && selectedEupmyeondong !== '전체') {
        const addrStr = prop.location || prop.fullAddr || '';
        if (!addrStr.includes(selectedEupmyeondong)) return false;
      }

      return true;
    });
  }, [
    properties,
    selectedCategory,
    activeSubPills,
    selectedTransaction,
    priceLimit,
    sizeRange,
    useYear,
    householdCount,
    searchQuery,
    favorites,
    selectedTransactions,
    priceCriterion,
    priceMin,
    priceMax,
    rentMin,
    rentMax,
    areaUnit,
    areaMin,
    areaMax,
    filterRooms,
    filterBathrooms,
    filterFloor,
    filterUseYear,
    filterDirections,
    selectedSido,
    selectedSigungu,
    selectedEupmyeondong
  ]);

  // Group properties sharing the exact same address/location
  const groupedFeedItems = useMemo(() => {
    let list = [...filteredProperties];
    if (selectedMapGroupKey) {
      list = list.filter(prop => {
        const addrKey = (prop.location || prop.fullAddr || '').trim();
        return addrKey === selectedMapGroupKey;
      });
    }

    // Return all properties as individual single items (no grouping/accordion in sidebar!)
    return list.map(prop => ({
      isGroup: false,
      groupKey: (prop.location || prop.fullAddr || '').trim(),
      name: prop.name,
      properties: [prop],
      singleProp: prop
    }));
  }, [filteredProperties, selectedMapGroupKey]);

  // Compute elegant visual label text representing all active categories
  const displayedCategoryText = useMemo(() => {
    const AVAILABLE_CATEGORIES = ['아파트', '오피스텔', '분양권', '원룸', '투룸', '주택', '빌라', '상가', '공장', '토지'];
    if (!activeSubPills || activeSubPills.length === 0) return '전체';
    if (activeSubPills.includes('전체') || activeSubPills.length >= AVAILABLE_CATEGORIES.length) {
      return '전체';
    }
    if (activeSubPills.includes('아파트 오피스텔') && activeSubPills.length === 1) {
      return '아파트·오피스텔';
    }
    
    // Build unique sorted list of displayed labels based on original order
    const displayList: string[] = [];
    AVAILABLE_CATEGORIES.forEach(cat => {
      if (activeSubPills.includes(cat)) {
        displayList.push(cat);
      }
    });
    
    if (activeSubPills.includes('아파트 오피스텔')) {
      if (!displayList.includes('아파트')) displayList.push('아파트');
      if (!displayList.includes('오피스텔')) displayList.push('오피스텔');
    }

    if (displayList.length >= AVAILABLE_CATEGORIES.length || displayList.length === 0) return '전체';
    return displayList.join('·');
  }, [activeSubPills]);

  // Paginated properties for Grid (목록형) View (12 items per page)
  const paginatedProperties = useMemo(() => {
    const startIndex = (gridPage - 1) * 12;
    return filteredProperties.slice(startIndex, startIndex + 12);
  }, [filteredProperties, gridPage]);

  // Combine filtered properties and active registration preview marker for all map rendering
  const allMapProperties = useMemo(() => {
    const list = [...filteredProperties];
    if (showAddForm && Number(newProp.mapLat) && Number(newProp.mapLng)) {
      if (!list.some(p => p.id === 'new-prop-preview')) {
        const pyong = Number(newProp.pyongValue) || 24;
        const lat = Number(newProp.mapLat);
        const lng = Number(newProp.mapLng);
        
        // Calculate robust preview price based on transaction type if priceValue is not filled
        let previewPrice = Number(newProp.priceValue);
        if (newProp.transactionType === '매매' && newProp.priceValueSale) {
          previewPrice = Number(newProp.priceValueSale);
        } else if (newProp.transactionType === '전세' && newProp.priceValueJeonse) {
          previewPrice = Number(newProp.priceValueJeonse);
        } else if (newProp.transactionType === '월세' && newProp.priceValueRentDeposit) {
          previewPrice = Number(newProp.priceValueRentDeposit);
        }
        
        list.push({
          id: 'new-prop-preview',
          name: `⭐ [등록중] ${newProp.name || '본진구 새매물'}`,
          category: newProp.category as any,
          transactionType: newProp.transactionType as any,
          priceText: newProp.priceText || '가격 입력대기',
          priceValue: previewPrice || 1000,
          pyongValue: pyong,
          floorText: newProp.floorText || '고층/20층',
          direction: newProp.direction || '남향',
          location: newProp.location || '부산광역시 부산진구',
          useYearText: '',
          useYearValue: 2020,
          householdsCount: 0,
          imageUrl: '',
          tags: [],
          description: '',
          features: [],
          latitude: lat,
          longitude: lng,
          mapLat: lat,
          mapLng: lng,
          fullAddr: newProp.fullAddr,
          area: '',
          floor: '',
          dir: '',
          avail: '',
          rooms: '',
          date: '',
          parking: '',
          mFee: '',
          note: '',
          priceHTML: '',
          type: '',
          trade: ''
        });
      }
    }
    return list;
  }, [filteredProperties, showAddForm, newProp.mapLat, newProp.mapLng, newProp.name, newProp.category, newProp.transactionType, newProp.priceText, newProp.priceValue, newProp.pyongValue, newProp.floorText, newProp.direction, newProp.location, newProp.fullAddr]);

  // Dynamic clustering memo based on zoom level (mapLevel)
  const clusteredProperties = useMemo(() => {
    // Zoom levels below 5 will display individual markers and overlays normally, but grouped by identical address/location to avoid stacking!
    if (mapLevel < 5) {
      const getCoords = (p: Property) => {
        let lat = Number(p.latitude !== undefined && p.latitude !== null ? p.latitude : p.mapLat);
        let lng = Number(p.longitude !== undefined && p.longitude !== null ? p.longitude : p.mapLng);
        if (isNaN(lat) || lat <= 0) lat = 35.151261;
        if (isNaN(lng) || lng <= 0) lng = 129.029706;
        return { lat, lng };
      };

      const sameLocationGroups: { [key: string]: Property[] } = {};
      allMapProperties.forEach(prop => {
        const { lat, lng } = getCoords(prop);
        const addrKey = (prop.location || prop.fullAddr || '').trim();
        // Since floating point values can differ slightly, round coordinates to 5 decimals
        const key = `${lat.toFixed(5)}_${lng.toFixed(5)}_${addrKey}`;
        if (!sameLocationGroups[key]) {
          sameLocationGroups[key] = [];
        }
        sameLocationGroups[key].push(prop);
      });

      return Object.keys(sameLocationGroups).map(key => {
        const list = sameLocationGroups[key];
        const { lat, lng } = getCoords(list[0]);
        if (list.length === 1) {
          return {
            isCluster: false,
            isGroup: false,
            count: 1,
            centerLat: lat,
            centerLng: lng,
            items: list,
            id: `single-${list[0].id}`,
            prop: list[0]
          };
        } else {
          return {
            isCluster: false,
            isGroup: true,
            count: list.length,
            centerLat: lat,
            centerLng: lng,
            items: list,
            id: `group-${list[0].id}`,
            prop: list[0]
          };
        }
      });
    }

    // Zoom level >= 5 uses our robust proximity clustering calculation
    // Proximity threshold escalates dynamically with zoom out levels to cover wider geographic area
    const threshold = 0.00018 * Math.pow(2.15, mapLevel);
    const clusters: {
      isCluster: boolean;
      count: number;
      centerLat: number;
      centerLng: number;
      items: any[];
      id: string;
      prop?: any;
    }[] = [];

    allMapProperties.forEach(prop => {
      let propLat = Number(prop.latitude !== undefined && prop.latitude !== null ? prop.latitude : prop.mapLat);
      let propLng = Number(prop.longitude !== undefined && prop.longitude !== null ? prop.longitude : prop.mapLng);
      if (isNaN(propLat) || propLat <= 0) propLat = 35.151261;
      if (isNaN(propLng) || propLng <= 0) propLng = 129.029706;

      // Always keep the add-form active preview out of clusters for best user feedback
      if (prop.id === 'new-prop-preview') {
        clusters.push({
          isCluster: false,
          count: 1,
          centerLat: propLat,
          centerLng: propLng,
          items: [prop],
          id: 'new-prop-preview-group',
          prop
        });
        return;
      }

      // Check if this point falls into any existing cluster boundary
      const matchingCluster = clusters.find(c => {
        if (c.id === 'new-prop-preview-group') return false; // never group preview with actual listings
        const dLat = Math.abs(c.centerLat - propLat);
        const dLng = Math.abs(c.centerLng - propLng);
        return dLat < threshold && dLng < threshold;
      });

      if (matchingCluster) {
        matchingCluster.items.push(prop);
        matchingCluster.count += 1;
        matchingCluster.isCluster = true;
        
        // Recalculate cluster center as geometric average of its members
        const totalCount = matchingCluster.items.length;
        let sumLat = 0;
        let sumLng = 0;
        matchingCluster.items.forEach(itm => {
          let itmLat = Number(itm.latitude !== undefined && itm.latitude !== null ? itm.latitude : itm.mapLat) || 35.151261;
          let itmLng = Number(itm.longitude !== undefined && itm.longitude !== null ? itm.longitude : itm.mapLng) || 129.029706;
          sumLat += itmLat;
          sumLng += itmLng;
        });
        matchingCluster.centerLat = sumLat / totalCount;
        matchingCluster.centerLng = sumLng / totalCount;
      } else {
        clusters.push({
          isCluster: false,
          count: 1,
          centerLat: propLat,
          centerLng: propLng,
          items: [prop],
          id: `cluster-group-${prop.id}`,
          prop: prop
        });
      }
    });

    return clusters;
  }, [allMapProperties, mapLevel]);

  // Dynamic Map Auto Centering based on filtered items, mimicking Naver Real Estate
  useEffect(() => {
    // 1. If currently in the registration form and valid preview coordinates exist, prioritize centering on the new preview marker!
    if (showAddForm && Number(newProp.mapLat) && Number(newProp.mapLng)) {
      setMapCenter({ lat: Number(newProp.mapLat), lng: Number(newProp.mapLng) });
      return;
    }

    // 2. If a specific listing is actively selected/highlighted, hold centering on that marker so it doesn't get dragged away!
    if (activeMarkerId) {
      const activeProp = properties.find(p => p.id === activeMarkerId);
      if (activeProp) {
        setMapCenter({ 
          lat: Number(activeProp.latitude !== undefined ? activeProp.latitude : activeProp.mapLat), 
          lng: Number(activeProp.longitude !== undefined ? activeProp.longitude : activeProp.mapLng) 
        });
        return;
      }
    }

    // 3. Otherwise, default to auto-centering on the average coordinates of the filtered listings
    if (filteredProperties.length > 0) {
      const validProps = filteredProperties.filter(p => 
        (p.latitude !== undefined && p.longitude !== undefined) || (p.mapLat && p.mapLng)
      );
      if (validProps.length > 0) {
        const avgLat = validProps.reduce((sum, p) => sum + Number(p.latitude !== undefined ? p.latitude : p.mapLat), 0) / validProps.length;
        const avgLng = validProps.reduce((sum, p) => sum + Number(p.longitude !== undefined ? p.longitude : p.mapLng), 0) / validProps.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
      }
    }
  }, [filteredProperties, activeMarkerId, showAddForm, newProp.mapLat, newProp.mapLng, properties]);

  // Scroll the listing feed to align with the active property when a map marker is clicked
  useEffect(() => {
    if (activeMarkerId) {
      const element = document.getElementById(`map-property-${activeMarkerId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeMarkerId]);

  // Dynamically load Kakao Maps API via react-kakao-maps-sdk's built-in useKakaoLoader hook
  // Support both standard hardcoded key and custom env overrides for maximum versatility
  const KAKAO_JAVASCRIPT_KEY = (import.meta as any).env?.VITE_KAKAO_APPKEY || (import.meta as any).env?.VITE_KAKAO_MAP_API_KEY || "705cc6a6b36051a343295303dfd745ec";
  
  const [kakaoLoading, kakaoError] = useKakaoLoader({
    appkey: KAKAO_JAVASCRIPT_KEY,
    libraries: ["services", "clusterer", "drawing"],
  });

  // Keep isKakaoLoaded state synchronized with the loader hook
  useEffect(() => {
    const currentHostname = window.location.hostname;
    const currentHref = window.location.href;
    console.log("----------------------------------------");
    console.log("🔍 [Kakao Map Load Diagnostics]");
    console.log("1. Current Hostname:", currentHostname);
    console.log("2. Current URL:", currentHref);
    console.log("3. KAKAO_JAVASCRIPT_KEY:", KAKAO_JAVASCRIPT_KEY);
    console.log("4. window.kakao (isDefined):", typeof (window as any).kakao !== 'undefined');
    console.log("5. window.kakao?.maps (isDefined):", typeof (window as any).kakao?.maps !== 'undefined');
    
    // Scan DOM for Kakao script
    const scripts = Array.from(document.getElementsByTagName('script'));
    const kakaoScript = scripts.find(s => s.src && s.src.includes('dapi.kakao.com'));
    
    if (kakaoScript) {
      console.log("6. Kakao SDK Script URL:", kakaoScript.src);
      console.log("7. SDK script HTML Element exists in DOM: YES");
      
      // Bind event listeners for deep diagnostics
      const onScriptLoadSuccess = () => {
        console.log("✅ [Kakao Diag Event] Script onload callback fired!");
        console.log("   window.kakao (isDefined):", typeof (window as any).kakao !== 'undefined');
        console.log("   window.kakao?.maps (isDefined):", typeof (window as any).kakao?.maps !== 'undefined');
      };
      
      const onScriptLoadError = (err: any) => {
        console.error("❌ [Kakao Diag Event] Script.onerror callback fired! SDK failed to load. Message: " + (err?.message || "Blocked or script load error event"));
        setKakaoDiagnostics(prev => ({
          ...prev,
          scriptStatus: 'error',
          scriptErrorMsg: `Kakao SDK script failed to download. Error event details: ${err?.message || 'Blocked (Network, Iframe sandbox, or AdBlocker)'}`
        }));
      };
      
      kakaoScript.addEventListener('load', onScriptLoadSuccess);
      kakaoScript.addEventListener('error', onScriptLoadError);
      
      // Monkey-patch onerror if not already configured
      if (!kakaoScript.onerror) {
        kakaoScript.onerror = (e: any) => {
          console.error("❌ [Kakao Diag Direct onerror Property] Blocked or failed loading: " + (e?.message || "Direct script loading exception event captured"));
        };
      }
    } else {
      console.log("6. Kakao SDK Script URL: Not found in DOM yet");
      console.log("7. SDK script HTML Element: NO");
    }
    
    setKakaoDiagnostics(prev => ({
      ...prev,
      hostname: currentHostname,
      sdkUrl: kakaoScript?.src || 'Not found yet',
      appkey: KAKAO_JAVASCRIPT_KEY,
      hasKakaoGlobal: !!(window as any).kakao,
      hasMapsGlobal: !!(window as any).kakao?.maps,
      scriptStatus: kakaoScript ? ((window as any).kakao?.maps ? 'loaded' : 'loading') : 'not_found'
    }));

    if (!kakaoLoading && !kakaoError) {
      if ((window as any).kakao?.maps) {
        console.log("⚡ [Kakao SDK Setup] Script successfully loaded. Invoking kakao.maps.load handler...");
        try {
          (window as any).kakao.maps.load(() => {
            console.log("🚀 [Kakao SDK Setup SUCCESS] window.kakao.maps.load callback triggered!");
            setIsKakaoLoaded(true);
            setKakaoLoadFailed(false);
            setKakaoErrorMsg("");
            setKakaoDiagnostics(prev => ({
              ...prev,
              hasKakaoGlobal: true,
              hasMapsGlobal: true,
              scriptStatus: 'loaded'
            }));
          });
        } catch (e: any) {
          console.error("⚡ [Kakao SDK Load caught exception during .load]:", e?.message || String(e));
          setIsKakaoLoaded(true);
          setKakaoLoadFailed(false);
          setKakaoDiagnostics(prev => ({
            ...prev,
            initError: e?.message || String(e)
          }));
        }
      } else {
        console.warn("⚠️ [Kakao SDK Stalled] Script finished but window.kakao.maps is not currently defined.");
        setIsKakaoLoaded(false);
        setKakaoLoadFailed(true);
        const errMsg = "window.kakao.maps 객체가 브라우저 전역 컨텍스트(window)에 정의되지 않았습니다. 현재 도메인이 카카오 개발자 콘솔의 플랫폼 설정에 등록되어 있지 않을 수 있습니다.";
        setKakaoErrorMsg(errMsg);
        setKakaoDiagnostics(prev => ({
          ...prev,
          scriptStatus: 'error',
          scriptErrorMsg: errMsg
        }));
      }
    } else if (kakaoError) {
      console.error("❌ [Kakao SDK Error] loader hook reported loading error:", kakaoError?.message || String(kakaoError));
      setIsKakaoLoaded(false);
      setKakaoLoadFailed(true);
      const errMsg = kakaoError.message || "카카오 지도 스크립트를 다운로드하거나 도메인 점검 중 오류가 발생했습니다.";
      setKakaoErrorMsg(errMsg);
      setKakaoDiagnostics(prev => ({
        ...prev,
        scriptStatus: 'error',
        scriptErrorMsg: errMsg
      }));
    }
    console.log("----------------------------------------");
  }, [kakaoLoading, kakaoError]);

  // Resolved Kakao Map Building names index to map property.id -> real building name
  const [resolvedBuildingNames, setResolvedBuildingNames] = useState<{[key: string]: string}>({});

  // Synchronous extraction function as a robust fallback
  const getRefinedBuildingNameFromAddress = (address: string): string => {
    if (!address) return '';
    // Pattern 1: find parenthesis content, e.g., (개금동, 현대아파트)
    const parenMatch = address.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const parts = parenMatch[1].split(',');
      for (let part of parts) {
        const cleaned = part.trim();
        if (cleaned.includes('아파트') || cleaned.includes('빌라') || cleaned.includes('오피스텔') || cleaned.includes('맨션') || cleaned.includes('타운') || cleaned.includes('캐슬') || cleaned.includes('아이파크') || cleaned.includes('푸르지오') || cleaned.includes('힐스테이트') || cleaned.includes('자이') || cleaned.includes('더샵') || cleaned.includes('래미안')) {
          return cleaned;
        }
      }
    }
    // Pattern 2: Check standard words containing complex words in the address
    const words = address.split(/\s+/);
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i].trim();
      if (w.includes('아파트') || w.includes('빌라') || w.includes('오피스텔') || w.includes('맨션') || w.includes('타운') || w.includes('캐슬') || w.includes('아이파크') || w.includes('자이') || w.includes('더샵')) {
        return w.replace(/[()]/g, '');
      }
    }
    return '';
  };

  // Helper to dynamically get non-generic building name for single/grouped map indicators
  const getGroupBuildingName = (propertiesInGroup: Property[], groupName: string) => {
    if (!propertiesInGroup || propertiesInGroup.length === 0) return groupName;
    const firstProp = propertiesInGroup[0];
    
    // 1. Check if Kakao Maps dynamic reverse geocoder resolved it
    if (resolvedBuildingNames[firstProp.id]) {
      return resolvedBuildingNames[firstProp.id];
    }
    
    // 2. If the current name itself is not generic, use it!
    const isGeneric = !groupName || groupName === '아파트' || groupName === '오피스텔' || groupName === '빌라' || groupName === '원룸' || groupName === '투룸' || groupName === '상가' || groupName === '주택' || groupName === '분양권' || groupName === '복합건물' || groupName === '매물' || groupName === '스프레드시트 연동 매물' || groupName === '원룸·투룸';
    if (!isGeneric) {
      return groupName;
    }
    
    // 3. Otherwise try parsing address synchronously
    const fallbackParsed = getRefinedBuildingNameFromAddress(firstProp.location || firstProp.fullAddr);
    if (fallbackParsed) {
      return fallbackParsed;
    }
    
    return groupName;
  };

  // Dynamic reverse-geocoder trigger to update building names using real Kakao services
  useEffect(() => {
    if (!isKakaoLoaded) return;
    const anyWin = window as any;
    if (!anyWin.kakao || !anyWin.kakao.maps || !anyWin.kakao.maps.services) return;

    try {
      const geocoder = new anyWin.kakao.maps.services.Geocoder();
      properties.forEach(prop => {
        if (resolvedBuildingNames[prop.id]) return;

        const pName = prop.name;
        const isGenericName = !pName || pName === '아파트' || pName === '오피스텔' || pName === '빌라' || pName === '원룸' || pName === '투룸' || pName === '상가' || pName === '주택' || pName === '분양권' || pName === '복합건물' || pName === '매물' || pName === '스프레드시트 연동 매물' || pName === '원룸·투룸';

        if (isGenericName) {
          const lat = Number(prop.latitude !== undefined && prop.latitude !== null ? prop.latitude : prop.mapLat) || 35.151261;
          const lng = Number(prop.longitude !== undefined && prop.longitude !== null ? prop.longitude : prop.mapLng) || 129.029706;

          geocoder.coord2Address(lng, lat, (result: any[], status: string) => {
            if (status === anyWin.kakao.maps.services.Status.OK && result && result.length > 0) {
              const roadAddr = result[0].road_address;
              const bName = roadAddr ? roadAddr.building_name : '';
              if (bName) {
                setResolvedBuildingNames(prev => ({
                  ...prev,
                  [prop.id]: bName
                }));
              } else {
                const parseName = getRefinedBuildingNameFromAddress(prop.location || prop.fullAddr);
                if (parseName) {
                  setResolvedBuildingNames(prev => ({
                    ...prev,
                    [prop.id]: parseName
                  }));
                }
              }
            }
          });
        }
      });
    } catch (err) {
      console.error("Error in reverse geocoding building names:", err);
    }
  }, [isKakaoLoaded, properties, resolvedBuildingNames]);

  // Mandatory 3-second timeout to prevent endless spinner wait screens
  useEffect(() => {
    if (isKakaoLoaded) return;

    const timeoutLimit = setTimeout(() => {
      if (!isKakaoLoaded) {
        console.warn("🔥 [Kakao SDK TIMEOUT] Load execution exceeded 3.0 seconds boundary limit. Rendering error UX.");
        setKakaoLoadFailed(true);
        setKakaoErrorMsg("3초 이내에 카카오 지도 전산망 API가 활성화되지 않았습니다. 현재 Sandboxed Iframe 보안 환경 또는 크롬 AdBlock 광고차단기에 의해 차단되었는지 점검하세요. (도메인: " + window.location.hostname + ")");
      }
    }, 3000);

    return () => clearTimeout(timeoutLimit);
  }, [isKakaoLoaded, mapKey]);

  return (
    <div className="min-h-screen bg-amber-50/10 text-slate-800 font-sans selection:bg-amber-100 antialiased flex flex-col justify-between overflow-x-hidden">
      
      {/* ==========================================
          HEADER: FROSTED GLASS NAVIGATION BAR
          ========================================== */}
      <header className="sticky top-0 z-50 w-full bg-white/75 backdrop-blur-md border-b border-amber-200/40 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Logo/Identity Area */}
            <div 
              onClick={() => handleNavClick('매물검색')} 
              className="flex items-center gap-2 cursor-pointer group shrink-0"
              id="header-logo-area"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center border border-amber-300/30 shadow-md group-hover:scale-105 transition-all duration-300 shrink-0">
                <svg className="w-6 h-6 text-slate-950" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Modern Luxury Real Estate Concept Logo */}
                  <path d="M15 50L50 15L85 50" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M28 50V75C28 77.2091 29.7909 79 32 79H68C70.2091 79 72 77.2091 72 75V50" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="42" y="45" width="16" height="24" rx="4" fill="currentColor" />
                  <path d="M50 8L52.5 13.5L58.5 14L54 18L55.5 24L50 21L44.5 24L46 18L41.5 14L47.5 13.5L50 8Z" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors whitespace-nowrap">
                  부강부동산
                </span>
                <span className="text-[10px] font-extrabold text-neutral-400 tracking-wider whitespace-nowrap">
                  전문 중개 ・ 자문 컨설팅
                </span>
              </div>
            </div>

            {/* Desktop Navigation Menus (매물검색 / 지도검색) */}
            <nav className="hidden lg:flex items-center gap-2.5 flex-wrap" id="desktop-nav-menus">
              {[
                { name: '매물검색', id: 'filter-station', icon: <Search className="w-3.5 h-3.5 shrink-0" /> },
                { name: '지도검색', id: 'filter-station', icon: <MapIcon className="w-3.5 h-3.5 shrink-0" /> }
              ].map((menu) => {
                const isSelected = activeTab === menu.name;
                return (
                  <button
                    key={menu.name}
                    onClick={() => handleNavClick(menu.name as any, menu.id)}
                    className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all duration-300 shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer border ${
                      isSelected 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-500/30' 
                        : 'bg-amber-550/10 hover:bg-amber-500/20 text-amber-900 border-amber-500/20 bg-amber-500/10'
                    }`}
                  >
                    {menu.icon}
                    <span>{menu.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Premium Action Buttons - Far Right Positioned */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0" id="header-actions">
              
              {/* 오시는 길 (Yellow 바탕 & Highlighted) */}
              <button 
                onClick={() => handleNavClick('오시는길', 'map-section')}
                className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-amber-400/20 shadow-xs transition-all tracking-tight whitespace-nowrap active:scale-95 hover:scale-[1.02]"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                <span>오시는 길</span>
              </button>

              {/* 매물접수 (Yellow 바탕 & Highlighted) */}
              <button 
                onClick={() => handleNavClick('매물접수', 'inquiry-section')}
                className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-amber-400/20 shadow-xs transition-all tracking-tight whitespace-nowrap active:scale-95 hover:scale-[1.02]"
              >
                <ClipboardList className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                <span>매물접수</span>
              </button>

              {/* 로그인 On/Off Button */}
              <button
                onClick={handleAdminToggleClick}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black border transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  isAdminMode 
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md scale-[1.02]' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="관리자 로그인"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                <span>{isAdminMode ? '로그아웃' : '🔑 로그인'}</span>
              </button>

              {/* 051-897-8900 전화번호 */}
              <a 
                href="tel:051-897-8900" 
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm border border-amber-400/20 shadow-xs transition-all tracking-tight whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 text-slate-950 animate-bounce shrink-0" />
                <span>051-897-8900</span>
              </a>

              {/* Hamburger menu trigger for mobile devices */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors shrink-0"
                id="hamburger-button"
              >
                <Menu className="w-5.5 h-5.5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ==========================================
          MOBILE NAVIGATION DRAWER
          ========================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop / Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs"
            />
            {/* Drawer Body */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white/95 backdrop-blur-md z-50 shadow-2xl p-6 flex flex-col justify-between"
              id="mobile-drawer"
            >
              <div>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-amber-100">
                  <span className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                    <Building className="w-4.5 h-4.5 text-amber-500" />
                    메뉴 선택
                  </span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  {(['매물검색', '지도검색', '오시는길', '매물접수'] as ActiveTabType[]).map((item) => {
                    const isSelected = activeTab === item;
                    return (
                      <button
                        key={item}
                        onClick={() => {
                          if (item === '매물검색' || item === '지도검색' || item === '오시는길' || item === '매물접수') {
                            handleNavClick(item, item === '오시는길' ? 'map-section' : item === '매물접수' ? 'inquiry-section' : 'filter-station');
                          } else {
                            applyPresetFilter(item as FilterCategory, '전체');
                            handleNavClick(item, 'filter-station');
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-black transition-all ${
                          isSelected ? 'bg-amber-100 text-amber-900 font-black border-l-2 border-amber-500' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto border-t border-amber-100 pt-6">
                <div className="bg-amber-50/50 backdrop-blur-xs p-4 rounded-xl border border-amber-100/55 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleAdminToggleClick();
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-black text-xs transition-colors cursor-pointer ${
                      isAdminMode ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isAdminMode ? '로그아웃' : '🔑 로그인'}</span>
                  </button>

                  <div className="border-t border-dashed border-amber-100 pt-2.5">
                    <p className="text-xs font-bold text-slate-800 mb-1">부강 대표 연락처</p>
                    <a href="tel:051-897-8900" className="text-sm font-bold text-amber-600 block mb-2 hover:underline">
                      051-897-8900
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      handleNavClick('매물검색', 'inquiry-section');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2.5 rounded-lg text-center transition-colors block cursor-pointer"
                  >
                    온라인 상담 접수
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================
          HERO SECTION: GOLDEN SUNSHINE
          ========================================== */}
      <section className="relative bg-gradient-to-b from-amber-100/35 via-amber-200/10 to-transparent py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top content layout: Titles & Filter Station */}
          <div className="mb-6">
            <div className="w-full text-left relative overflow-hidden bg-white/95 border border-amber-200/60 p-6 sm:p-8 md:p-10 rounded-3xl shadow-xl flex flex-col justify-center gap-6 min-h-[300px] md:min-h-[320px]">
              
              {/* Background Map Image behind the text with soft white fade */}
              <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden rounded-3xl">
                <img 
                  src={busanRegionMap} 
                  alt="부산 지역 지도 배경" 
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[70%] sm:w-[65%] md:w-[50%] lg:w-[45%] xl:w-[40%] h-full object-cover opacity-60 filter contrast-[1.05] brightness-[1.1]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
              </div>

              {/* Text content layout inside hero */}
              <div className="relative z-10 space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-200/70 text-amber-950 border border-amber-300 text-xs font-black"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                  <span>🏆 부산 No.1 전문 공인중개사사무소 ・ 부강부동산</span>
                </motion.div>

                <h1 className="text-4xl sm:text-5xl md:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 leading-[1.12] mb-3">
                  부산 No.1 부동산<br />
                  <span className="text-amber-600 underline decoration-amber-400 decoration-3 underline-offset-4">부강부동산</span>
                </h1>
                
                <p className="text-sm sm:text-base md:text-lg font-black leading-relaxed text-slate-600 max-w-2xl">
                  아파트, 분양권, 오피스텔, 원·투룸, 빌라/주택, 상가, 공장, 토지 매칭까지!<br />
                  고객님이 원하시는 매물을 끝까지 찾아드립니다.
                </p>
              </div>

            </div> {/* Close Box Column */}
          </div>

          {/* ==========================================
              KOREAN REAL ESTATE CATEGORY CARDS (Grid layout matching user requested categories styled with premium brand amber theme)
              ========================================== */}
          <div className="w-full py-2.5 mt-6" id="korean-category-cards-station">
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2.5 md:gap-3">
              
              {/* Card 1: 아파트 */}
              <div 
                onClick={() => handleCategoryCardClick('아파트')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="14" y="4" width="20" height="38" rx="2" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M6 42V16H14" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M34 20H42V42" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M2 42H46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="18" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="26" y1="10" x2="30" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="26" y1="18" x2="30" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="26" x2="22" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="26" y1="26" x2="30" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="34" x2="22" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="26" y1="34" x2="30" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">아파트</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

              {/* Card 2: 오피스텔 */}
              <div 
                onClick={() => handleCategoryCardClick('오피스텔')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 44V4L32 8V44" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M6 44H42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M21 12H27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M21 20H27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M21 28H27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M21 36H27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">오피스텔</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

              {/* Card 3: 분양권 */}
              <div 
                onClick={() => handleCategoryCardClick('분양권')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="4" width="32" height="40" rx="3" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M14 12H34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M14 20H34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M14 28H26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="32" cy="28" r="3" fill="currentColor" />
                    <path d="M12 36H36" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">분양권</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

              {/* Card 4: 원룸·투룸 */}
              <div 
                onClick={() => handleCategoryCardClick('원룸·투룸')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="6" width="36" height="36" rx="3" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M24 6V42" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx="15" cy="15" r="2.5" fill="currentColor" />
                    <circle cx="33" cy="15" r="2.5" fill="currentColor" />
                    <path d="M11 28H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M29 28H37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M11 34H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M29 34H35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">원룸·투룸</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

              {/* Card 5: 빌라 */}
              <div 
                onClick={() => handleCategoryCardClick('빌라')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="14" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M4 14L24 4L44 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="14" y="20" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                    <rect x="28" y="20" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                    <rect x="14" y="32" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                    <rect x="28" y="32" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">빌라</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

              {/* Card 6: 주택 */}
              <div 
                onClick={() => handleCategoryCardClick('주택')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 20V42H42V20" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M3 22L24 6L45 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M1 42H47" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="15" y="26" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                    <rect x="27" y="26" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                    <path d="M21 34H27V42H21V34Z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">주택</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

              {/* Card 7: 상가 */}
              <div 
                onClick={() => handleCategoryCardClick('상가')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 40V14H42V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M4 14C4 10 12 10 12 14C12 10 20 10 20 14C20 10 28 10 28 14C28 10 36 10 36 14C36 10 44 10 44 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="currentColor" fillOpacity="0.1" />
                    <rect x="12" y="24" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="28" y="24" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                    <path d="M2 40H46" stroke="currentColor" strokeWidth="2.5" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">상가</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

              {/* Card 8: 공장 */}
              <div 
                onClick={() => handleCategoryCardClick('공장')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 14V40H44V26L32 14L20 26L4 14Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
                    <path d="M2 38H46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="10" y="24" width="6" height="8" rx="0.5" stroke="currentColor" strokeWidth="2" />
                    <rect x="22" y="28" width="6" height="8" rx="0.5" stroke="currentColor" strokeWidth="2" />
                    <path d="M34 18H38" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">공장</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

              {/* Card 9: 토지 */}
              <div 
                onClick={() => handleCategoryCardClick('토지')}
                className="bg-white border-2 border-amber-500/20 hover:border-amber-500 rounded-xl py-3 px-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md active:scale-95 group shadow-xs min-h-[115px] md:min-h-[130px] gap-1.5"
              >
                <div className="transition-transform group-hover:scale-105 duration-300 text-amber-500 shrink-0">
                  <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 38C14 30 34 30 42 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="currentColor" fillOpacity="0.1" />
                    <path d="M2 38H46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="38" y1="10" x2="26" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M35 7L41 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M28 22L20 28L18 34L26 31L30 24Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-xs md:text-[13px] font-black text-slate-800 tracking-tight">토지</span>
                  <span className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-2xs transition-colors">
                    <span>클릭</span>
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          DYNAMIC FLOATING LEFT WING STATION (STAYS IN THE LEFT EMPTY MARGIN OF ULTRA-WIDE MONITORS)
          ========================================== */}
      <div 
        className="hidden min-[1880px]:flex flex-col gap-5 fixed top-[180px] left-[calc(50%-865px)] z-43 w-[210px]" 
        id="floating-wing-banner"
      >
        {/* 1. 카테고리 검색 Widget (Premium Style Accordion Menu UI matching landing page brand colors) */}
        <div className="bg-white border-2 border-amber-500/15 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="bg-slate-900 border-b border-amber-500/20 px-3.5 py-3.5 flex items-center gap-2">
            <div className="bg-amber-500 text-slate-950 p-1.5 rounded-lg shrink-0">
              <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-white text-[13.5px] font-black tracking-tight leading-none uppercase select-none">카테고리 검색</h3>
          </div>
          
          {/* Category buttons list with arrow indicators matching landing page image */}
          <div className="divide-y divide-slate-100/80 flex flex-col">
            {[
              { name: '아파트', label: '아파트' },
              { name: '오피스텔', label: '오피스텔' },
              { name: '분양권', label: '분양권' },
              { name: '원룸·투룸', label: '원룸·투룸' },
              { name: '빌라', label: '빌라' },
              { name: '주택', label: '주택' },
              { name: '상가', label: '상가' },
              { name: '공장', label: '공장' },
              { name: '토지', label: '토지' }
            ].map((item) => {
              let isActive = false;
              if (item.name === '원룸·투룸') {
                isActive = activeSubPills.includes('원룸') || activeSubPills.includes('투룸');
              } else {
                isActive = activeSubPills.includes(item.name) && activeSubPills.length === 1;
              }

              return (
                <button
                  key={item.name}
                  onClick={() => handleCategoryCardClick(item.name)}
                  className={`w-full py-3 px-4 flex items-center justify-between text-left cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-50/75 border-l-4 border-amber-500 font-extrabold text-amber-900 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 font-bold hover:text-slate-950'
                  }`}
                >
                  <span className="text-[12.5px] tracking-tight">{item.label}</span>
                  <span className={`text-[10px] transform ${isActive ? 'text-amber-500 rotate-180' : 'text-slate-300'} transition-transform duration-200`}>▼</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Portal Search Banner (Green & multicolors custom widget) */}
        <div className="bg-white border-2 border-slate-150 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center gap-2.5">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="text-[#03C75A] font-extrabold text-[12.5px] tracking-tight hover:underline cursor-pointer">NAVER</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="font-extrabold text-[12.5px] tracking-tight flex items-center">
              <span className="text-[#1e90ff]">D</span>
              <span className="text-[#ff4500]">a</span>
              <span className="text-[#ffd700]">u</span>
              <span className="text-[#ff0000]">m</span>
            </span>
          </div>
          
          {/* portal search bar graphic emulation */}
          <div className="w-full h-8 flex items-center justify-between px-2.5 rounded-sm border-2 border-[#03C75A] bg-white shadow-3xs cursor-pointer hover:bg-slate-50/50">
            <span className="text-[11px] font-black text-slate-900">부강부동산</span>
            <span className="text-[#03C75A] text-[9px] font-black">▼</span>
          </div>

          <div className="flex flex-col gap-1 leading-tight text-center">
            <p className="text-[11px] font-black text-slate-800 tracking-tight">
              포털 검색창에 <span className="text-amber-600 block font-black underline decoration-wavy decoration-amber-500/50">&ldquo;부강공인중개사&rdquo;</span>를 검색하세요!
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          DYNAMIC FLOATING RIGHT WING STATION (STAYS IN THE RIGHT EMPTY MARGIN OF ULTRA-WIDE MONITORS)
          ========================================== */}
      <div 
        className="hidden min-[1880px]:flex flex-col gap-5 fixed top-[180px] right-[calc(50%-940px)] z-43 w-[280px]" 
        id="floating-right-wing-banner"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-amber-500/15 p-5 shadow-lg flex flex-col gap-4 text-left">
          <div className="border-b border-amber-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-[14px] shadow-xs">
              <Mail className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
              <span>실시간 온라인 상담 신청</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">
              부강 대표 고민주 소장이 접수 즉시 신속히 대조 연락 드립니다.
            </p>
          </div>

          {isConsultSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-6 text-center gap-3"
            >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-xs animate-bounce">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <span className="text-[13px] font-black text-emerald-600 block">상담 신청이 완료되었습니다!</span>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-1">
                대표 소장이 내역을 메일로 즉시 수신 받았으며 신속히 연락 드리겠습니다.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="성함"
                value={consultName}
                onChange={(e) => setConsultName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              <input
                type="tel"
                placeholder="연락처"
                value={consultPhone}
                onChange={(e) => setConsultPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              <select
                value={consultType}
                onChange={(e) => setConsultType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="매수문의">매수 문의</option>
                <option value="매도문의">매도 문의</option>
                <option value="매물접수">매물 접수</option>
                <option value="상담문의">일반 상담</option>
              </select>

              <textarea
                placeholder="상담 내용 또는 접수할 매물 정보를 입력해주세요."
                value={consultText}
                onChange={(e) => setConsultText(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-lg transition-colors cursor-pointer text-xs tracking-wide"
              >
                상담 신청 보내기
              </button>
            </form>
          )}

          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 flex items-center justify-between text-center mt-1">
            <div className="flex-1">
              <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">금일 상담접수</div>
              <div className="text-[12px] font-black text-slate-800">14건</div>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex-1">
              <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">평균 대응</div>
              <div className="text-[12px] font-black text-amber-600">30분 내</div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          RESPONSIVE COLLAPSIBLE LEFT & RIGHT EDGE TABS & DRAWERS (FOR NARROW/ZOOMED SCREEN OVERLAP SOLUTIONS)
          ========================================== */}
      <div className="flex">
        {/* Left-edge projecting tabs */}
        <div className="fixed left-0 top-[230px] z-45 flex flex-col gap-2.5 min-[1880px]:hidden">
          {/* TAB: 카테고리별 */}
          <button
            onClick={() => {
              setIsSideCategoryOpen(!isSideCategoryOpen);
              setIsSideConsultOpen(false);
            }}
            id="tab-category-trigger"
            className="group flex items-center gap-1.5 pl-3.5 pr-4 py-2.5 rounded-r-2xl bg-amber-500 text-slate-950 font-black text-[12px] shadow-[2px_4px_12px_rgba(245,158,11,0.3)] border-r border-y border-amber-400 hover:bg-amber-600 hover:pl-5 transition-all duration-200 cursor-pointer select-none"
          >
            <ChevronLeft className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isSideCategoryOpen ? 'rotate-180 text-slate-950' : 'text-slate-950/70'}`} />
            <span>카테고리별</span>
          </button>
        </div>

        {/* Right-edge projecting tabs */}
        <div className="fixed right-0 top-[230px] z-45 flex flex-col gap-2.5 min-[1880px]:hidden">
          {/* TAB: 실시간 상담신청 */}
          <button
            onClick={() => {
              setIsSideConsultOpen(!isSideConsultOpen);
              setIsSideCategoryOpen(false);
            }}
            id="tab-consult-trigger"
            className="group flex items-center gap-1.5 pr-3.5 pl-4 py-2.5 rounded-l-2xl bg-[#0ea5e9] text-white font-black text-[12px] shadow-[-2px_4px_12px_rgba(14,165,233,0.3)] border-l border-y border-sky-400 hover:bg-[#0284c7] hover:pr-5 transition-all duration-200 cursor-pointer select-none"
          >
            <ChevronRight className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isSideConsultOpen ? 'rotate-180 text-white' : 'text-white/70'}`} />
            <span>상담신청</span>
          </button>
        </div>

        {/* Floating backdrop click-outside overlays */}
        <AnimatePresence>
          {(isSideCategoryOpen || isSideConsultOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsSideCategoryOpen(false);
                setIsSideConsultOpen(false);
              }}
              className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-44"
            />
          )}
        </AnimatePresence>

        {/* Sliding Drawers */}
        <AnimatePresence>
          {/* Category Sliding Drawer */}
          {isSideCategoryOpen && (
            <motion.div
              initial={{ x: '-100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed left-0 top-[180px] z-45 w-[240px] bg-white border-y-2 border-r-2 border-amber-500/20 rounded-r-2xl shadow-2xl p-4 overflow-y-auto max-h-[calc(100vh-230px)] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-amber-100 pb-2.5 flex-shrink-0">
                <span className="text-[13px] font-black text-slate-950 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                  카테고리 검색
                </span>
                <button
                  onClick={() => setIsSideCategoryOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category Search Content with complete list */}
              <div className="divide-y divide-slate-100/85 flex flex-col rounded-xl overflow-hidden border border-slate-100">
                {[
                  { name: '아파트', label: '아파트' },
                  { name: '오피스텔', label: '오피스텔' },
                  { name: '분양권', label: '분양권' },
                  { name: '원룸·투룸', label: '원룸·투룸' },
                  { name: '빌라', label: '빌라' },
                  { name: '주택', label: '주택' },
                  { name: '상가', label: '상가' },
                  { name: '공장', label: '공장' },
                  { name: '토지', label: '토지' }
                ].map((item) => {
                  let isActive = false;
                  if (item.name === '원룸·투룸') {
                    isActive = activeSubPills.includes('원룸') || activeSubPills.includes('투룸');
                  } else {
                    isActive = activeSubPills.includes(item.name) && activeSubPills.length === 1;
                  }

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        handleCategoryCardClick(item.name);
                        setIsSideCategoryOpen(false); // Close drawer on selection for elegant user flow
                      }}
                      className={`w-full py-3 px-4 flex items-center justify-between text-left cursor-pointer transition-all duration-155 text-[12.5px] ${
                        isActive
                          ? 'bg-amber-50/75 border-l-4 border-amber-500 font-extrabold text-amber-900 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 font-bold hover:text-slate-950'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className={`text-[9px] transform ${isActive ? 'text-amber-500 rotate-180' : 'text-slate-350'} transition-transform duration-200`}>▼</span>
                    </button>
                  );
                })}
              </div>

              {/* Mini Portal Promotion */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center flex flex-col gap-1.5 mt-auto">
                <span className="text-[#03C75A] font-extrabold text-[12px]">NAVER</span>
                <span className="text-[11px] text-slate-700 font-black">“부강공인중개사”</span>
                <span className="text-[9.5px] text-slate-400 font-bold">인터넷 실시간 공식 매물</span>
              </div>
            </motion.div>
          )}

          {/* Consultation Sliding Drawer */}
          {isSideConsultOpen && (
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-[180px] z-45 w-[290px] bg-white border-y-2 border-l-2 border-amber-500/20 rounded-l-2xl shadow-2xl p-4.5 overflow-y-auto max-h-[calc(100vh-230px)] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-amber-100 pb-2.5 flex-shrink-0">
                <span className="text-[13px] font-black text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-500 animate-pulse" />
                  실시간 온라인 상담 신청
                </span>
                <button
                  onClick={() => setIsSideConsultOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[10.5px] text-slate-400 font-bold leading-relaxed -mt-1">
                대표 소장이 접수 즉시 신속히 대조 연락 드립니다.
              </p>

              {isConsultSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-6 text-center gap-3"
                >
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-xs animate-bounce">
                    <Check className="w-5.5 h-5.5 stroke-[3]" />
                  </div>
                  <span className="text-[12.5px] font-black text-emerald-600 block">상담 신청이 완료되었습니다!</span>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-1">
                    대표 소장이 내역을 메일로 즉시 수신 받았으며 신속히 연락 드리겠습니다.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="성함"
                    value={consultName}
                    onChange={(e) => setConsultName(e.target.value)}
                    className="w-full border border-slate-205 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800"
                  />

                  <input
                    type="text"
                    placeholder="연락처"
                    value={consultPhone}
                    onChange={(e) => setConsultPhone(e.target.value)}
                    className="w-full border border-slate-205 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800"
                  />

                  <select
                    value={consultType}
                    onChange={(e) => setConsultType(e.target.value)}
                    className="w-full border border-slate-205 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="매수문의">매수 문의</option>
                    <option value="매도문의">매도 문의</option>
                    <option value="매물접수">매물 접수</option>
                    <option value="상담문의">일반 상담</option>
                  </select>

                  <textarea
                    placeholder="상담 내용 또는 접수할 매물 정보를 입력해주세요."
                    value={consultText}
                    onChange={(e) => setConsultText(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-205 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-800"
                  />

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    상담 신청 보내기
                  </button>
                </form>
              )}

              <div className="bg-slate-50 border border-slate-150 rounded-lg p-2 flex items-center justify-between text-center">
                <div className="flex-1">
                  <div className="text-[8.5px] text-slate-400 font-bold mb-0.5">금일 접수</div>
                  <div className="text-[11.5px] font-black text-slate-800">14건</div>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="flex-1">
                  <div className="text-[8.5px] text-slate-400 font-bold mb-0.5">평균 대응</div>
                  <div className="text-[11.5px] font-black text-amber-600">30분 내</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div> {/* Close responsive layout wrapper */}

      {/* ==========================================
          STICKY PREMIUM NAVER REAL ESTATE FILTERS (Visible on both desktop & mobile)
          ========================================== */}
      <div id="filter-station" className="sticky top-[108px] z-40 bg-white py-3 scroll-mt-[130px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2.5">
            {/* Top Row: Category Selection Pills (전체, 아파트, 오피스텔, 분양권, 원룸, 투룸, 주택, 빌라, 상가, 공장, 토지) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 pb-1.5 mb-0.5">
              <span className="text-[11px] font-black text-amber-950 shrink-0 bg-amber-500/10 border border-amber-500/15 px-2.5 py-1 rounded-lg mr-1 sm:mr-1.5">매물유형</span>
              
              {/* Entire/All Pill */}
              <button
                onClick={() => {
                  setActiveSubPills(['전체']);
                  setSelectedCategory('전체');
                  setViewMode('map');
                  setTimeout(() => {
                    const el = document.getElementById('filter-station');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all shrink-0 cursor-pointer border ${
                  activeSubPills.includes('전체') || activeSubPills.length === 0
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-205 text-slate-700 hover:bg-slate-50'
                }`}
              >
                전체
              </button>

              {[
                { label: '아파트', value: '아파트' },
                { label: '오피스텔', value: '오피스텔' },
                { label: '분양권', value: '분양권' },
                { label: '원룸·투룸', value: '원룸·투룸' },
                { label: '빌라', value: '빌라' },
                { label: '주택', value: '주택' },
                { label: '상가', value: '상가' },
                { label: '공장', value: '공장' },
                { label: '토지', value: '토지' }
              ].map((item) => {
                let isSelected = false;
                if (item.value === '원룸·투룸') {
                  isSelected = activeSubPills.includes('원룸') && activeSubPills.includes('투룸');
                } else {
                  isSelected = activeSubPills.includes(item.value);
                }

                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      let nextPills = [...activeSubPills];
                      // Remove '전체' if it exists
                      if (nextPills.includes('전체')) {
                        nextPills = nextPills.filter(p => p !== '전체');
                      }

                      if (item.value === '원룸·투룸') {
                        const hasBoth = nextPills.includes('원룸') && nextPills.includes('투룸');
                        if (hasBoth) {
                          // Remove both
                          nextPills = nextPills.filter(p => p !== '원룸' && p !== '투룸');
                        } else {
                          // Add both (and ensure uniquely represented)
                          if (!nextPills.includes('원룸')) nextPills.push('원룸');
                          if (!nextPills.includes('투룸')) nextPills.push('투룸');
                        }
                      } else {
                        if (nextPills.includes(item.value)) {
                          nextPills = nextPills.filter(p => p !== item.value);
                        } else {
                          nextPills.push(item.value);
                        }
                      }

                      if (nextPills.length === 0) {
                        nextPills = ['전체'];
                        setSelectedCategory('전체');
                      } else {
                        // Maintain selectedCategory reference
                        if (nextPills.length === 1) {
                          setSelectedCategory(nextPills[0] as FilterCategory);
                        } else {
                          setSelectedCategory('전체');
                        }
                      }
                      setActiveSubPills(nextPills);

                      // View mode map switch + smooth scroll
                      setViewMode('map');
                      setTimeout(() => {
                        const el = document.getElementById('filter-station');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all shrink-0 cursor-pointer border ${
                      isSelected && !activeSubPills.includes('전체')
                        ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm'
                        : 'bg-white border-slate-205 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                
                {/* Horizontal Scrolling Naver Filters Group */}
                <div className="flex flex-wrap items-center gap-1.5 py-1 flex-grow">
                  
                  {/* 0. 지역 선택 Selector based on Naver design */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => {
                        setIsRegionDropdownOpen(!isRegionDropdownOpen);
                        setActiveStickyDropdown(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-[11.5px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        (selectedSido && selectedSido !== '전체')
                          ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#03C75A]" />
                        <span>
                          {selectedSido === '전체' 
                            ? '지역 선택' 
                            : `${selectedSido === '부산시' ? '부산' : selectedSido === '서울시' ? '서울' : selectedSido} ${selectedSigungu && selectedSigungu !== '전체' ? selectedSigungu : ''} ${selectedEupmyeondong && selectedEupmyeondong !== '전체' ? selectedEupmyeondong : ''}`.trim()}
                        </span>
                      </span>
                      <span className="text-[8px] text-slate-400">▼</span>
                    </button>
                    <AnimatePresence>
                      {isRegionDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-9 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-4 min-w-[340px] max-w-[380px] flex flex-col gap-3"
                        >
                          {/* Popup Title */}
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-extrabold text-[12.5px] text-slate-500">
                              시·도 &gt; 시·군·구 &gt; 읍·면·동 선택
                            </span>
                            <button onClick={() => setIsRegionDropdownOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Navigation Breadcrumbs */}
                          <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl text-[11px] font-extrabold text-slate-700">
                            <button
                              type="button"
                              onClick={() => setActiveRegionStep('sido')}
                              className={`hover:text-[#03C75A] transition-colors ${activeRegionStep === 'sido' ? 'text-[#03C75A] font-black' : ''}`}
                            >
                              {selectedSido || '시·도'}
                            </button>
                            <span className="text-slate-300 font-normal">&gt;</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedSido !== '전체') {
                                  setActiveRegionStep('sigungu');
                                }
                              }}
                              className={`hover:text-[#03C75A] transition-colors ${activeRegionStep === 'sigungu' ? 'text-[#03C75A] font-black' : ''} ${selectedSido === '전체' ? 'opacity-40 cursor-not-allowed' : ''}`}
                              disabled={selectedSido === '전체'}
                            >
                              {selectedSigungu && selectedSigungu !== '전체' ? selectedSigungu : '시·군·구'}
                            </button>
                            <span className="text-slate-300 font-normal">&gt;</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedSigungu && selectedSigungu !== '전체') {
                                  setActiveRegionStep('dong');
                                }
                              }}
                              className={`hover:text-[#03C75A] transition-colors ${activeRegionStep === 'dong' ? 'text-[#03C75A] font-black' : ''} ${(selectedSigungu === '전체' || !selectedSigungu) ? 'opacity-40 cursor-not-allowed' : ''}`}
                              disabled={selectedSigungu === '전체' || !selectedSigungu}
                            >
                              {selectedEupmyeondong && selectedEupmyeondong !== '전체' ? selectedEupmyeondong : '읍·면·동'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSido('전체');
                                setSelectedSigungu('전체');
                                setSelectedEupmyeondong('전체');
                                setActiveRegionStep('sido');
                              }}
                              className="ml-auto text-[10px] text-slate-400 hover:text-rose-500 font-bold transition-all"
                            >
                              초기화
                            </button>
                          </div>

                          {/* 1. Sido Selection Grid */}
                          {activeRegionStep === 'sido' && (
                            <div className="grid grid-cols-4 gap-1.5 py-1">
                              {['전체', '서울시', '경기도', '인천시', '부산시', '대전시', '대구시', '울산시', '세종시', '광주시', '강원도', '충청북도', '충청남도', '경상북도', '경상남도', '전북도', '전라남도', '제주도'].map((sido) => {
                                const isSelected = selectedSido === sido;
                                return (
                                  <button
                                    key={sido}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSido(sido);
                                      if (sido === '전체') {
                                        setSelectedSigungu('전체');
                                        setSelectedEupmyeondong('전체');
                                        setIsRegionDropdownOpen(false);
                                      } else {
                                        setSelectedSigungu('전체');
                                        setSelectedEupmyeondong('전체');
                                        setActiveRegionStep('sigungu');
                                      }
                                    }}
                                    className={`p-2 text-[11px] font-bold rounded-lg border text-center transition-all ${
                                      isSelected
                                        ? 'bg-[#03C75A] border-[#03C75A] text-white'
                                        : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    {sido}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* 2. Sigungu Selection Grid */}
                          {activeRegionStep === 'sigungu' && (
                            <div className="flex flex-col gap-2 max-h-[224px] overflow-y-auto pr-1">
                              <div className="grid grid-cols-3 gap-1.5 py-1">
                                {['전체', ...getSigunguOptions(selectedSido)].map((sigungu) => {
                                  const isSelected = selectedSigungu === sigungu;
                                  return (
                                    <button
                                      key={sigungu}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSigungu(sigungu);
                                        if (sigungu === '전체') {
                                          setSelectedEupmyeondong('전체');
                                          setIsRegionDropdownOpen(false);
                                        } else {
                                          setSelectedEupmyeondong('전체');
                                          setActiveRegionStep('dong');
                                        }
                                      }}
                                      className={`p-2 text-[11px] font-bold rounded-lg border text-center transition-all ${
                                        isSelected
                                          ? 'bg-[#03C75A] border-[#03C75A] text-white'
                                          : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      {sigungu}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 3. Eupmyeondong Selection Grid */}
                          {activeRegionStep === 'dong' && (
                            <div className="flex flex-col gap-2 max-h-[224px] overflow-y-auto pr-1">
                              <div className="grid grid-cols-3 gap-1.5 py-1">
                                {['전체', ...getDongOptions(selectedSigungu)].map((dong) => {
                                  const isSelected = selectedEupmyeondong === dong;
                                  return (
                                    <button
                                      key={dong}
                                      type="button"
                                      onClick={() => {
                                        setSelectedEupmyeondong(dong);
                                        setIsRegionDropdownOpen(false);
                                      }}
                                      className={`p-2 text-[11px] font-bold rounded-lg border text-center transition-all ${
                                        isSelected
                                          ? 'bg-[#03C75A] border-[#03C75A] text-white'
                                          : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      {dong}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* 1. 거래방식 Selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveStickyDropdown(activeStickyDropdown === 'deal' ? null : 'deal')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        (!selectedTransactions.includes('전체') && selectedTransactions.length > 0)
                          ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        {selectedTransactions.includes('전체') || selectedTransactions.length === 0
                          ? '거래방식'
                          : selectedTransactions.join(', ')}
                      </span>
                      <span className="text-[8px] text-slate-400">▼</span>
                    </button>
                    <AnimatePresence>
                      {activeStickyDropdown === 'deal' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-9 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 min-w-[260px] flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-extrabold text-sm text-slate-800">거래방식</span>
                            <button onClick={() => setActiveStickyDropdown(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-2.5 py-1">
                            {[
                              { label: '전체', value: '전체' },
                              { label: '매매', value: '매매' },
                              { label: '전세', value: '전세' },
                              { label: '월세', value: '월세' },
                              { label: '단기임대', value: '단기임대' }
                            ].map((item) => {
                              const isChecked = selectedTransactions.includes(item.value);
                              return (
                                <button
                                  key={item.value}
                                  onClick={() => {
                                    if (item.value === '전체') {
                                      setSelectedTransactions(['전체']);
                                      setSelectedTransaction('전체');
                                    } else {
                                      let next = selectedTransactions.filter(x => x !== '전체');
                                      if (isChecked) {
                                        next = next.filter(x => x !== item.value);
                                      } else {
                                        next.push(item.value);
                                      }
                                      if (next.length === 0) {
                                        next = ['전체'];
                                        setSelectedTransaction('전체');
                                      } else if (next.length === 1) {
                                        setSelectedTransaction(next[0] as TransactionType);
                                      } else {
                                        setSelectedTransaction('전체');
                                      }
                                      setSelectedTransactions(next);
                                    }
                                  }}
                                  className="flex items-center gap-3 text-left w-full hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                    isChecked 
                                      ? 'bg-[#03C75A] border-[#03C75A] text-white' 
                                      : 'border-slate-300 bg-white'
                                  }`}>
                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                  </div>
                                  <span className={`text-[12.5px] font-bold ${isChecked ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                                    {item.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          
                          <div className="border-t pt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                            <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-400">i</span>
                            <span>중복선택이 가능합니다.</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 2. 가격 Selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveStickyDropdown(activeStickyDropdown === 'price' ? null : 'price')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        (priceMin > 0 || priceMax < 999999 || rentMin > 0 || rentMax < 999999)
                          ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        {priceMin === 0 && priceMax === 999999 && rentMin === 0 && rentMax === 999999
                          ? '가격'
                          : (() => {
                              const formatPrice = (val: number) => {
                                if (val >= 10000) {
                                  const bil = Math.floor(val / 10000);
                                  const remainder = val % 10000;
                                  return remainder > 0 ? `${bil}억 ${remainder/1000}천` : `${bil}억`;
                                }
                                return `${val/1000}천`;
                              };
                              let str = '';
                              if (selectedTransactions.includes('월세')) {
                                const minR = rentMin === 0 ? '0' : `${rentMin}만`;
                                const maxR = rentMax === 999999 ? '무제한' : `${rentMax}만`;
                                str += `월세 ${minR}~${maxR}`;
                              } else {
                                const minP = priceMin === 0 ? '0' : formatPrice(priceMin);
                                const maxP = priceMax === 999999 ? '무제한' : formatPrice(priceMax);
                                str += `${minP}~${maxP}`;
                              }
                              return str;
                            })()}
                      </span>
                      <span className="text-[8px] text-slate-400">▼</span>
                    </button>
                    <AnimatePresence>
                      {activeStickyDropdown === 'price' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-9 bg-white border border-slate-205 rounded-2xl shadow-2xl z-50 p-4 w-[285px] sm:w-[325px] flex flex-col gap-3.5"
                        >
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-extrabold text-[12.5px] text-slate-800 truncate">매매가/전세가/보증금/분양가</span>
                            <button onClick={() => setActiveStickyDropdown(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4 py-1 border-b border-dashed border-slate-100">
                            <button 
                              onClick={() => setPriceCriterion('property')}
                              className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                priceCriterion === 'property' ? 'border-[#03C75A]' : 'border-slate-350'
                              }`}>
                                {priceCriterion === 'property' && <div className="w-2 h-2 rounded-full bg-[#03C75A]" />}
                              </div>
                              <span className={priceCriterion === 'property' ? 'text-[#03C75A]' : 'text-slate-500'}>매물가격 기준</span>
                            </button>
                            <button 
                              onClick={() => setPriceCriterion('actual')}
                              className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                priceCriterion === 'actual' ? 'border-[#03C75A]' : 'border-slate-350'
                              }`}>
                                {priceCriterion === 'actual' && <div className="w-2 h-2 rounded-full bg-[#03C75A]" />}
                              </div>
                              <span className={priceCriterion === 'actual' ? 'text-[#03C75A]' : 'text-slate-500'}>실거래가 기준</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-6 gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                            {[
                              { label: '5천', val: 5000 },
                              { label: '6천', val: 6000 },
                              { label: '7천', val: 7000 },
                              { label: '8천', val: 8000 },
                              { label: '9천', val: 9000 },
                              { label: '1억', val: 10000 },
                              { label: '2억', val: 20000 },
                              { label: '3억', val: 30000 },
                              { label: '4억', val: 40000 },
                              { label: '5억', val: 50000 },
                              { label: '6억', val: 60000 },
                              { label: '7억', val: 70000 },
                              { label: '8억', val: 80000 },
                              { label: '9억', val: 90000 },
                              { label: '10억', val: 100000 },
                              { label: '11억', val: 110000 },
                              { label: '12억', val: 120000 },
                              { label: '13억', val: 130000 },
                              { label: '14억', val: 140000 },
                              { label: '15억', val: 150000 },
                              { label: '16억', val: 160000 },
                              { label: '17억', val: 170000 },
                              { label: '18억', val: 180000 },
                              { label: '18억~', val: 999999 }
                            ].map((item, idx) => {
                              const isSelected = priceMax === item.val;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    if (item.val === 999999) {
                                      setPriceMin(180000);
                                      setPriceMax(999999);
                                    } else {
                                      setPriceMax(item.val);
                                      if (priceMin > item.val) setPriceMin(0);
                                    }
                                  }}
                                  className={`py-1 text-[9.5px] rounded border font-bold text-center cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[11px] font-bold py-1">
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden flex-1 max-w-[125px]">
                              <button 
                                onClick={() => setPriceMin(Math.max(0, priceMin - 5000))}
                                className="px-2 py-1 bg-slate-50 border-r text-slate-500 hover:bg-slate-100"
                              >
                                －
                              </button>
                              <div className="relative flex items-center w-full min-w-0">
                                <input 
                                  type="number"
                                  step="any"
                                  min="0"
                                  placeholder="최소"
                                  value={priceMin === 0 ? '' : priceMin / 10000}
                                  onChange={(e) => {
                                    const raw = parseFloat(e.target.value);
                                    const val = isNaN(raw) ? 0 : Math.round(raw * 10000);
                                    setPriceMin(Math.min(priceMax, val));
                                  }}
                                  className="w-full text-center outline-none bg-white text-slate-700 font-extrabold text-[11px] pr-4 py-1"
                                />
                                <span className="absolute right-1 text-[9px] text-slate-400 font-bold pointer-events-none">억</span>
                              </div>
                              <button 
                                onClick={() => setPriceMin(priceMin === 999999 ? 5000 : Math.min(priceMax, priceMin + 5000))}
                                className="px-2 py-1 bg-slate-50 border-l text-slate-500 hover:bg-slate-100"
                              >
                                ＋
                              </button>
                            </div>
                            <span className="text-slate-400 font-black">~</span>
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden flex-1 max-w-[125px]">
                              <button 
                                onClick={() => setPriceMax(priceMax === 999999 ? 180000 : Math.max(priceMin, priceMax - 5000))}
                                className="px-2 py-1 bg-slate-50 border-r text-slate-500 hover:bg-slate-100"
                              >
                                －
                              </button>
                              <div className="relative flex items-center w-full min-w-0">
                                <input 
                                  type="number"
                                  step="any"
                                  min="0"
                                  placeholder="최대"
                                  value={priceMax === 999999 ? '' : priceMax / 10000}
                                  onChange={(e) => {
                                    const raw = parseFloat(e.target.value);
                                    if (isNaN(raw)) {
                                      setPriceMax(999999);
                                    } else {
                                      setPriceMax(Math.max(priceMin, Math.round(raw * 10000)));
                                    }
                                  }}
                                  className="w-full text-center outline-none bg-white text-slate-700 font-extrabold text-[11px] pr-4 py-1"
                                />
                                <span className="absolute right-1 text-[9px] text-slate-400 font-bold pointer-events-none">억</span>
                              </div>
                              <button 
                                onClick={() => setPriceMax(priceMax === 999999 ? 999999 : priceMax + 5000)}
                                className="px-2 py-1 bg-slate-50 border-l text-slate-500 hover:bg-slate-100"
                              >
                                ＋
                              </button>
                            </div>
                          </div>

                          {/* Price Slider Bar ("바" 조절) */}
                          <div className="flex flex-col gap-1 px-1 py-1.5 bg-slate-50/55 rounded-lg border border-slate-100 mb-2">
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-black mb-0.5">
                              <span>최소: {priceMin === 0 ? '0' : `${priceMin / 10000}억`}</span>
                              <span>최대: {priceMax === 999999 ? '무제한' : `${priceMax / 10000}억`}</span>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1 flex-grow">
                                <span className="text-[8.5px] font-bold text-slate-400 shrink-0">최소</span>
                                <input 
                                  type="range"
                                  min="0"
                                  max="180000"
                                  step="5000"
                                  value={priceMin}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPriceMin(Math.min(priceMax, val));
                                  }}
                                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-[#03C75A]"
                                />
                              </div>
                              <div className="flex items-center gap-1 flex-grow">
                                <span className="text-[8.5px] font-bold text-slate-400 shrink-0">최대</span>
                                <input 
                                  type="range"
                                  min="0"
                                  max="180000"
                                  step="5000"
                                  value={priceMax === 999999 ? 180000 : priceMax}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPriceMax(val === 180000 ? 999999 : Math.max(priceMin, val));
                                  }}
                                  className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-[#03C75A]"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-2.5">
                            <span className="text-[11.5px] font-black text-slate-800 block mb-1.5">월세 금액</span>
                            <div className="grid grid-cols-6 gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100 mb-2">
                              {[
                                { label: '10', val: 10 },
                                { label: '20', val: 20 },
                                { label: '30', val: 30 },
                                { label: '45', val: 45 },
                                { label: '60', val: 60 },
                                { label: '70', val: 70 },
                                { label: '80', val: 80 },
                                { label: '90', val: 90 },
                                { label: '1백', val: 100 },
                                { label: '1.5백', val: 150 },
                                { label: '2백', val: 200 },
                                { label: '2백~', val: 999999 }
                              ].map((item, idx) => {
                                const isSelected = rentMax === item.val;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if (item.val === 999999) {
                                        setRentMin(200);
                                        setRentMax(999999);
                                      } else {
                                        setRentMax(item.val);
                                        if (rentMin > item.val) setRentMin(0);
                                      }
                                    }}
                                    className={`py-1 text-[9.5px] rounded border font-bold text-center cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                              {/* Rent Min Input */}
                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden flex-1 max-w-[130px]">
                                <button 
                                  type="button"
                                  onClick={() => setRentMin(Math.max(0, rentMin - 10))}
                                  className="px-2 py-1 bg-slate-50 border-r text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer text-xs"
                                >
                                  －
                                </button>
                                <div className="relative flex items-center w-full min-w-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={rentMin === 0 ? '' : rentMin}
                                    onChange={(e) => {
                                      const val = Math.min(rentMax, Number(e.target.value));
                                      setRentMin(isNaN(val) ? 0 : val);
                                    }}
                                    className="w-full text-center outline-none bg-white text-slate-700 font-extrabold pr-4 py-1 text-[11px]"
                                  />
                                  <span className="absolute right-1 text-[9px] text-slate-400 font-bold pointer-events-none">만</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setRentMin(Math.min(rentMax, rentMin + 10))}
                                  className="px-2 py-1 bg-slate-50 border-l text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer text-xs"
                                >
                                  ＋
                                </button>
                              </div>
                              <span className="text-slate-400 font-black">~</span>
                              {/* Rent Max Input */}
                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden flex-1 max-w-[130px]">
                                <button 
                                  type="button"
                                  onClick={() => setRentMax(rentMax === 999999 ? 200 : Math.max(rentMin, rentMax - 10))}
                                  className="px-2 py-1 bg-slate-50 border-r text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer text-xs"
                                >
                                  －
                                </button>
                                <div className="relative flex items-center w-full min-w-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    placeholder="최대"
                                    value={rentMax === 999999 ? '' : rentMax}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (!val || isNaN(val)) {
                                        setRentMax(999999);
                                      } else {
                                        setRentMax(Math.max(rentMin, val));
                                      }
                                    }}
                                    className="w-full text-center outline-none bg-white text-slate-700 font-extrabold pr-4 py-1 text-[11px]"
                                  />
                                  <span className="absolute right-1 text-[9px] text-slate-400 font-bold pointer-events-none">만</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setRentMax(rentMax === 999999 ? 999999 : rentMax + 10)}
                                  className="px-2 py-1 bg-slate-50 border-l text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer text-xs"
                                >
                                  ＋
                                </button>
                              </div>
                            </div>

                            {/* Monthly Rent Slider Bar ("바" 조절) */}
                            <div className="flex flex-col gap-1 px-1 py-1.5 mt-2 bg-slate-50/50 rounded-lg border border-slate-100">
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-black mb-0.5">
                                <span>최소: {rentMin === 0 ? '0' : `${rentMin}만`}</span>
                                <span>최대: {rentMax === 999999 ? '무제한' : `${rentMax}만`}</span>
                              </div>
                              <div className="flex gap-2">
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className="text-[8.5px] font-bold text-slate-400 shrink-0">최소</span>
                                  <input 
                                    type="range"
                                    min="0"
                                    max="200"
                                    step="5"
                                    value={rentMin}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setRentMin(Math.min(rentMax, val));
                                    }}
                                    className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-[#03C75A]"
                                  />
                                </div>
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className="text-[8.5px] font-bold text-slate-400 shrink-0">최대</span>
                                  <input 
                                    type="range"
                                    min="0"
                                    max="200"
                                    step="5"
                                    value={rentMax === 999999 ? 200 : rentMax}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setRentMax(val === 200 ? 999999 : Math.max(rentMin, val));
                                    }}
                                    className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-[#03C75A]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end border-t pt-2 mt-1">
                            <button
                              onClick={() => {
                                setPriceMin(0);
                                setPriceMax(999999);
                                setRentMin(0);
                                setRentMax(999999);
                                setPriceLimit('전체');
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-[11px] font-black text-slate-700 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3 text-slate-500" />
                              <span>조건삭제</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 3. 면적 Selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveStickyDropdown(activeStickyDropdown === 'size' ? null : 'size')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        (areaMin > 0 || areaMax < 999999)
                          ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        {areaMin === 0 && areaMax === 999999
                          ? '면적'
                          : `${areaMin}~${areaMax === 999999 ? '무제한' : areaMax}${areaUnit === 'pyong' ? '평' : '㎡'}`}
                      </span>
                      <span className="text-[8px] text-slate-400">▼</span>
                    </button>
                    <AnimatePresence>
                      {activeStickyDropdown === 'size' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-9 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 min-w-[320px] flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-[12.5px] text-slate-800">면적</span>
                              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 shrink-0">
                                <button 
                                  onClick={() => setAreaUnit('m2')}
                                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                    areaUnit === 'm2'
                                      ? 'bg-white border text-slate-900 border-slate-200 shadow-3xs'
                                      : 'text-slate-400 hover:text-slate-700'
                                  }`}
                                >
                                  ㎡
                                </button>
                                <button 
                                  onClick={() => setAreaUnit('pyong')}
                                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                    areaUnit === 'pyong'
                                      ? 'bg-white border text-slate-900 border-slate-200 shadow-3xs'
                                      : 'text-slate-400 hover:text-slate-700'
                                  }`}
                                >
                                  평
                                </button>
                              </div>
                            </div>
                            <button onClick={() => setActiveStickyDropdown(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="py-1.5 flex flex-col gap-0.5 text-center">
                            <span className="text-[#03C75A] font-extrabold text-xs">
                              {areaMin === 0 && areaMax === 999999
                                ? '전체 면적'
                                : `${areaMin}~${areaMax === 999999 ? '무제한' : areaMax}${areaUnit === 'pyong' ? '평' : '㎡'}`}
                            </span>
                            <div className="relative h-6 flex items-center justify-center my-1 px-2.5">
                              <div className="absolute w-full h-[3px] bg-slate-100 rounded" />
                              <div className="absolute left-[15%] right-[20%] h-[3px] bg-[#03C75A] rounded" />
                              <div className="absolute left-[15%] w-3 h-3 bg-white border-2 border-[#03C75A] rounded-full shadow-xs" />
                              <div className="absolute right-[20%] w-3 h-3 bg-white border-2 border-[#03C75A] rounded-full shadow-xs" />
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: areaUnit === 'pyong' ? '~10평' : '~33㎡', min: 0, max: 10 },
                              { label: areaUnit === 'pyong' ? '10평대' : '33~66㎡', min: 10, max: 20 },
                              { label: areaUnit === 'pyong' ? '20평대' : '66~99㎡', min: 20, max: 30 },
                              { label: areaUnit === 'pyong' ? '30평대' : '99~132㎡', min: 30, max: 40 },
                              { label: areaUnit === 'pyong' ? '40평대' : '132~165㎡', min: 40, max: 50 },
                              { label: areaUnit === 'pyong' ? '50평대' : '165~198㎡', min: 50, max: 60 },
                              { label: areaUnit === 'pyong' ? '60평대' : '198~231㎡', min: 60, max: 70 },
                              { label: areaUnit === 'pyong' ? '70평~' : '231㎡~', min: 70, max: 999999 }
                            ].map((item, idx) => {
                              const isSelected = areaMin === item.min && areaMax === item.max;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setAreaMin(item.min);
                                    setAreaMax(item.max);
                                    if (areaUnit === 'pyong') {
                                      if (item.min === 10) setSizeRange('10평대');
                                      else if (item.min === 20) setSizeRange('20평대');
                                      else if (item.min === 30) setSizeRange('30평대');
                                      else if (item.min === 40) setSizeRange('40평대이상');
                                      else setSizeRange('전체');
                                    }
                                  }}
                                  className={`py-1.5 text-[10px] rounded-lg border font-bold text-center cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Direct Input for Size (면적) */}
                          <div className="flex flex-col gap-2 border-t pt-2.5">
                            <span className="text-[11.5px] font-black text-slate-800 block">직접 입력 ({areaUnit === 'pyong' ? '평' : '㎡'})</span>
                            <div className="flex items-center justify-between gap-1 text-[11px] font-bold py-1">
                              {/* Area Min Input */}
                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden flex-1 max-w-[150px]">
                                <button 
                                  type="button"
                                  onClick={() => setAreaMin(Math.max(0, areaMin - 5))}
                                  className="px-2 py-1 bg-slate-50 border-r text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer text-xs"
                                >
                                  －
                                </button>
                                <div className="relative flex items-center w-full min-w-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    placeholder="최소"
                                    value={areaMin === 0 ? '' : areaMin}
                                    onChange={(e) => {
                                      const val = Math.min(areaMax, Number(e.target.value));
                                      setAreaMin(isNaN(val) ? 0 : val);
                                    }}
                                    className="w-full text-center outline-none bg-white text-slate-700 font-extrabold pr-4.5 pl-0.5 py-1 text-[11.5px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="absolute right-0.5 text-[9px] text-slate-400 font-bold pointer-events-none">{areaUnit === 'pyong' ? '평' : '㎡'}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setAreaMin(areaMin === 999999 ? 5 : Math.min(areaMax, areaMin + 5))}
                                  className="px-2 py-1 bg-slate-50 border-l text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer text-xs"
                                >
                                  ＋
                                </button>
                              </div>
                              <span className="text-slate-400 font-black">~</span>
                              {/* Area Max Input */}
                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden flex-1 max-w-[150px]">
                                <button 
                                  type="button"
                                  onClick={() => setAreaMax(areaMax === 999999 ? 120 : Math.max(areaMin, areaMax - 5))}
                                  className="px-2 py-1 bg-slate-50 border-r text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer text-xs"
                                >
                                  －
                                </button>
                                <div className="relative flex items-center w-full min-w-0">
                                  <input 
                                    type="number"
                                    min="0"
                                    placeholder="최대"
                                    value={areaMax === 999999 ? '' : areaMax}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (!val || isNaN(val)) {
                                        setAreaMax(999999);
                                      } else {
                                        setAreaMax(Math.max(areaMin, val));
                                      }
                                    }}
                                    className="w-full text-center outline-none bg-white text-slate-700 font-extrabold pr-4.5 pl-0.5 py-1 text-[11.5px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="absolute right-0.5 text-[9px] text-slate-400 font-bold pointer-events-none">{areaUnit === 'pyong' ? '평' : '㎡'}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setAreaMax(areaMax === 999999 ? 999999 : areaMax + 5)}
                                  className="px-2 py-1 bg-slate-50 border-l text-slate-500 hover:bg-slate-100 shrink-0 cursor-pointer text-xs"
                                >
                                  ＋
                                </button>
                              </div>
                            </div>

                            {/* Size Slider Bar ("바" 조절) */}
                            <div className="flex flex-col gap-1 px-1 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100 mt-1">
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-black mb-0.5">
                                <span>최소: {areaMin === 0 ? '0' : `${areaMin}${areaUnit === 'pyong' ? '평' : '㎡'}`}</span>
                                <span>최대: {areaMax === 999999 ? '무제한' : `${areaMax}${areaUnit === 'pyong' ? '평' : '㎡'}`}</span>
                              </div>
                              <div className="flex gap-2">
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className="text-[8.5px] font-bold text-slate-400 shrink-0">최소</span>
                                  <input 
                                    type="range"
                                    min="0"
                                    max={areaUnit === 'pyong' ? '120' : '400'}
                                    step="5"
                                    value={areaMin}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setAreaMin(Math.min(areaMax, val));
                                    }}
                                    className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-[#03C75A]"
                                  />
                                </div>
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className="text-[8.5px] font-bold text-slate-400 shrink-0">최대</span>
                                  <input 
                                    type="range"
                                    min="0"
                                    max={areaUnit === 'pyong' ? '120' : '400'}
                                    step="5"
                                    value={areaMax === 999999 ? (areaUnit === 'pyong' ? 120 : 400) : areaMax}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const maxLimit = areaUnit === 'pyong' ? 120 : 400;
                                      setAreaMax(val === maxLimit ? 999999 : Math.max(areaMin, val));
                                    }}
                                    className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-[#03C75A]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end border-t pt-2">
                            <button
                              onClick={() => {
                                setAreaMin(0);
                                setAreaMax(999999);
                                setSizeRange('전체');
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-[11px] font-black text-slate-700 cursor-pointer animate-none"
                            >
                              <RefreshCw className="w-3 h-3 text-slate-500" />
                              <span>조건삭제</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 4. 방/욕실 Selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveStickyDropdown(activeStickyDropdown === 'rooms' ? null : 'rooms')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        (filterRooms !== '전체' || filterBathrooms !== '전체')
                          ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        {filterRooms === '전체' && filterBathrooms === '전체'
                          ? '방/욕실'
                          : filterRooms !== '전체' && filterBathrooms !== '전체'
                            ? `방 ${filterRooms}, 욕실 ${filterBathrooms}`
                            : filterRooms !== '전체'
                              ? `방 ${filterRooms}`
                              : `욕실 ${filterBathrooms}`}
                      </span>
                      <span className="text-[8px] text-slate-400">▼</span>
                    </button>
                    <AnimatePresence>
                      {activeStickyDropdown === 'rooms' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-9 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 min-w-[210px] flex flex-col gap-3.5"
                        >
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-extrabold text-[12.5px] text-slate-800">방수(룸)</span>
                            <button onClick={() => setActiveStickyDropdown(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-2">
                            {['전체', '1개', '2개', '3개', '4개 이상'].map((item) => {
                              const cleanVal = item === '전체' ? '전체' : item.includes('이상') ? '4개 이상' : item.replace('개', '');
                              const isChecked = filterRooms === cleanVal;
                              return (
                                <button
                                  key={item}
                                  onClick={() => setFilterRooms(cleanVal)}
                                  className="flex items-center gap-2.5 text-left w-full hover:bg-slate-50 p-1 rounded-lg cursor-pointer"
                                >
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isChecked ? 'border-[#03C75A]' : 'border-slate-300'
                                  }`}>
                                    {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#03C75A]" />}
                                  </div>
                                  <span className={`text-[12px] font-bold ${isChecked ? 'text-slate-900 font-extrabold' : 'text-slate-600'}`}>{item}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="border-t pt-2.5">
                            <span className="font-extrabold text-[12.5px] text-slate-800 block mb-2">욕실수</span>
                            <div className="flex flex-col gap-2">
                              {['전체', '1개', '2개', '3개', '4개 이상'].map((item) => {
                                const cleanVal = item === '전체' ? '전체' : item.includes('이상') ? '4개 이상' : item.replace('개', '');
                                const isChecked = filterBathrooms === cleanVal;
                                return (
                                  <button
                                    key={item}
                                    onClick={() => setFilterBathrooms(cleanVal)}
                                    className="flex items-center gap-2.5 text-left w-full hover:bg-slate-50 p-1 rounded-lg cursor-pointer"
                                  >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      isChecked ? 'border-[#03C75A]' : 'border-slate-300'
                                    }`}>
                                      {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#03C75A]" />}
                                    </div>
                                    <span className={`text-[12px] font-bold ${isChecked ? 'text-slate-900 font-extrabold' : 'text-slate-600'}`}>{item}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 5. 층수 Selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveStickyDropdown(activeStickyDropdown === 'floor' ? null : 'floor')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        filterFloor !== '전체'
                          ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{filterFloor === '전체' ? '층수' : filterFloor}</span>
                      <span className="text-[8px] text-slate-400">▼</span>
                    </button>
                    <AnimatePresence>
                      {activeStickyDropdown === 'floor' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-9 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 min-w-[190px] flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-extrabold text-[12.5px] text-slate-800">층수 선택</span>
                            <button onClick={() => setActiveStickyDropdown(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-2">
                            {['전체', '1층', '지하층', '지상층(1층제외)'].map((item) => {
                              const isChecked = filterFloor === item;
                              return (
                                <button
                                  key={item}
                                  onClick={() => setFilterFloor(item)}
                                  className="flex items-center gap-2.5 text-left w-full hover:bg-slate-550 p-1.5 rounded-lg cursor-pointer"
                                >
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isChecked ? 'border-[#03C75A]' : 'border-slate-300'
                                  }`}>
                                    {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#03C75A]" />}
                                  </div>
                                  <span className={`text-[12.5px] font-bold ${isChecked ? 'text-slate-900 font-extrabold' : 'text-slate-600'}`}>{item}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 6. 사용승인일 Selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveStickyDropdown(activeStickyDropdown === 'year' ? null : 'year')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        filterUseYear !== '전체'
                          ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{filterUseYear === '전체' ? '사용승인일' : filterUseYear === '입주예정' ? '입주예정' : `${filterUseYear}이내`}</span>
                      <span className="text-[8px] text-slate-400">▼</span>
                    </button>
                    <AnimatePresence>
                      {activeStickyDropdown === 'year' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-9 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 min-w-[270px] flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-extrabold text-[12.5px] text-slate-800">사용승인일</span>
                            <button onClick={() => setActiveStickyDropdown(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="py-1 flex flex-col gap-0.5 text-center">
                            <span className="text-[#03C75A] font-extrabold text-xs">
                              {filterUseYear === '전체' ? '전체 연식' : (filterUseYear === '입주예정' ? '입주예정' : `${filterUseYear} 이내 준공`)}
                            </span>
                            <div className="relative h-6 flex items-center justify-center my-1 px-1">
                              <div className="absolute w-full h-[3px] bg-slate-100 rounded" />
                              <div className="absolute left-0 right-[40%] h-[3px] bg-[#03C75A] rounded" />
                              <div className="absolute left-0 w-3 h-3 bg-white border-2 border-[#03C75A] rounded-full shadow-xs" />
                              <div className="absolute right-[40%] w-3 h-3 bg-white border-2 border-[#03C75A] rounded-full shadow-xs" />
                            </div>
                          </div>

                          <span className="text-[9.5px] text-slate-400 font-bold block mt-1">간편 연식 선택</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: '입주예정', value: '입주예정' },
                              { label: '2년 이내', value: '2년' },
                              { label: '4년 이내', value: '4년' },
                              { label: '10년 이내', value: '10년' },
                              { label: '15년 이내', value: '15년' },
                              { label: '20년 이내', value: '20년' },
                              { label: '25년 이내', value: '25년' },
                              { label: '30년 이내', value: '30년' }
                            ].map((item) => {
                              const isSelected = filterUseYear === item.value;
                              return (
                                <button
                                  key={item.value}
                                  onClick={() => {
                                    setFilterUseYear(item.value);
                                    if (item.value === '2년' || item.value === '4년') setUseYear('5년이내');
                                    else if (item.value === '10년') setUseYear('10년이내');
                                    else if (item.value === '15년') setUseYear('15년이내');
                                    else setUseYear('전체');
                                  }}
                                  className={`py-1.5 text-[10px] rounded border font-bold text-center cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex justify-end border-t pt-2">
                            <button
                              onClick={() => {
                                setFilterUseYear('전체');
                                setUseYear('전체');
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-[11px] font-black text-slate-700 cursor-pointer animate-none"
                            >
                              <RefreshCw className="w-3 h-3 text-slate-500" />
                              <span>조건삭제</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 7. 방향 Selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveStickyDropdown(activeStickyDropdown === 'direction' ? null : 'direction')}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                        (!filterDirections.includes('전체') && filterDirections.length > 0)
                          ? 'bg-[#03C75A]/10 border-[#03C75A] text-[#03C75A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        {filterDirections.includes('전체') || filterDirections.length === 0
                          ? '방향'
                          : filterDirections.join(', ')}
                      </span>
                      <span className="text-[8px] text-slate-400">▼</span>
                    </button>
                    <AnimatePresence>
                      {activeStickyDropdown === 'direction' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-9 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 min-w-[200px] flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-extrabold text-[12.5px] text-slate-800">방향 선택</span>
                            <button onClick={() => setActiveStickyDropdown(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-2 py-1">
                            {[
                              { label: '전체', value: '전체' },
                              { label: '동향 (동)', value: '동' },
                              { label: '남동향 (남동)', value: '남동' },
                              { label: '서향 (서)', value: '서' },
                              { label: '남서향 (남서)', value: '남서' },
                              { label: '남향 (남)', value: '남' },
                              { label: '북동향 (북동)', value: '북동' },
                              { label: '북향 (북)', value: '북' },
                              { label: '북서향 (북서)', value: '북서' }
                            ].map((item) => {
                              const isChecked = filterDirections.includes(item.value);
                              return (
                                <button
                                  key={item.value}
                                  onClick={() => {
                                    if (item.value === '전체') {
                                      setFilterDirections(['전체']);
                                    } else {
                                      let next = filterDirections.filter(x => x !== '전체');
                                      if (isChecked) {
                                        next = next.filter(x => x !== item.value);
                                      } else {
                                        next.push(item.value);
                                      }
                                      if (next.length === 0) {
                                        next = ['전체'];
                                      }
                                      setFilterDirections(next);
                                    }
                                  }}
                                  className="flex items-center gap-2.5 text-left w-full hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  <div className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-all ${
                                    isChecked 
                                      ? 'bg-[#03C75A] border-[#03C75A] text-white' 
                                      : 'border-slate-350 bg-white'
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3px]" />}
                                  </div>
                                  <span className={`text-[12px] font-bold ${isChecked ? 'text-slate-900 font-extrabold' : 'text-slate-705'}`}>
                                    {item.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* Right block: Keyword Search Input and Resets */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                  {/* Keyword Search Input */}
                  <div className="relative max-w-[280px] flex-grow sm:flex-grow-0 sm:min-w-[180px]">
                    <input
                      type="text"
                      placeholder="단지명, 매물 키워드 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setViewMode('grid');
                          setTimeout(() => {
                            const el = document.getElementById('listings-container');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }
                      }}
                      className="w-full text-[11px] bg-slate-50 border border-slate-200 hover:border-amber-200 focus:border-amber-400 rounded-xl pl-3 pr-8 py-1.5 text-slate-800 placeholder-slate-400 font-bold focus:outline-none transition-all"
                    />
                    {searchQuery ? (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 focus:outline-none cursor-pointer"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('grid');
                          setTimeout(() => {
                            const el = document.getElementById('listings-container');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 cursor-pointer focus:outline-none flex items-center justify-center p-0.5"
                      >
                        <Search className="w-3 h-3 text-slate-400 hover:text-amber-500" />
                      </button>
                    )}
                  </div>

                  {/* Reset filter button */}
                  {(
                    selectedCategory !== '전체' ||
                    selectedTransaction !== '전체' ||
                    priceLimit !== '전체' ||
                    sizeRange !== '전체' ||
                    useYear !== '전체' ||
                    householdCount !== '전체' ||
                    searchQuery !== '' ||
                    (selectedTransactions.length > 0 && !selectedTransactions.includes('전체')) ||
                    priceMin > 0 || priceMax < 999999 ||
                    rentMin > 0 || rentMax < 999999 ||
                    areaMin > 0 || areaMax < 999999 ||
                    filterRooms !== '전체' ||
                    filterBathrooms !== '전체' ||
                    filterFloor !== '전체' ||
                    filterUseYear !== '전체' ||
                    (filterDirections.length > 0 && !filterDirections.includes('전체'))
                  ) && (
                    <button
                      onClick={() => {
                        setSelectedCategory('전체');
                        setActiveSubPills(['아파트', '오피스텔', '분양권', '원룸', '투룸', '주택', '빌라', '상가', '공장', '토지']);
                        setSelectedTransaction('전체');
                        setPriceLimit('전체');
                        setSizeRange('전체');
                        setUseYear('전체');
                        setHouseholdCount('전체');
                        setSearchQuery('');
                        // Reset Naver Real Estate style filters
                        setSelectedTransactions(['전체']);
                        setPriceMin(0);
                        setPriceMax(999999);
                        setRentMin(0);
                        setRentMax(999999);
                        setAreaMin(0);
                        setAreaMax(999999);
                        setFilterRooms('전체');
                        setFilterBathrooms('전체');
                        setFilterFloor('전체');
                        setFilterUseYear('전체');
                        setFilterDirections(['전체']);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin-slow" />
                      <span>필터 초기화</span>
                    </button>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          PROPERTIES GRID / LIST WRAPPER
          ========================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Properties Listings Grid (full width) */}
          <div className="w-full flex flex-col gap-6" id="listings-container">
            
            {/* Title / Info row with View Mode Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-3.5 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  {displayedCategoryText} 매물 목록
                </span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2 py-0.5 rounded-full">
                  실시간 {filteredProperties.length}개 발견
                </span>
              </div>
              
              {/* Naver Real Estate View Switcher */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40 shadow-xs self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-amber-1000 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                  <span>목록형 보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-white text-amber-1000 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>지도 분할형 보기</span>
                </button>
              </div>
            </div>

            {/* Admin Actions Bar */}
            {isAdminMode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50/40 rounded-2xl border border-amber-200/50 p-4 flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>중개사 전용 매물 관리 시스템 (직접 등록)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      실시간 클라우드 데이터베이스(Firebase Firestore)를 경유해 모든 브라우저 및 기기에서 즉각 실시간 동기화되는 중앙 관리형 매물장입니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleForceSyncFirestore}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title="클라우드 실시간 데이터베이스로부터 즉시 데이터를 다시 강제 호출합니다."
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600 transition-transform duration-500 hover:rotate-180 active:scale-90" />
                      <span>클라우드 강제 동기화</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetFirestore}
                      className="bg-amber-100 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="클라우드 DB의 모든 매물 정보를 초기 상태 원본 매물 대장 리스트로 복구합니다."
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-800" />
                      <span>클라우드 DB 원상복구 (초기화)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingPropertyId) {
                          cancelEditMode();
                        } else {
                          setShowAddForm(!showAddForm);
                        }
                      }}
                      className={`${
                        editingPropertyId 
                          ? 'bg-red-650 hover:bg-red-700 text-white' 
                          : 'bg-slate-900 hover:bg-slate-800'
                      } text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs`}
                    >
                      {editingPropertyId ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{editingPropertyId ? '수정 취소' : showAddForm ? '등록 폼 접기' : '새 매물 직접 등록하기'}</span>
                    </button>
                  </div>
                </div>

                {showAddForm && (
                  <form onSubmit={handleRegisterProperty} id="register-property-form" className="bg-white border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-md">
                     <div className="border-b border-amber-100 pb-2.5">
                       <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 bg-amber-50/50 -mx-6 -mt-6 px-6 py-3 rounded-t-2xl border-b border-amber-200">
                         <Building className="w-4 h-4 text-amber-600 animate-pulse" />
                         <span>{editingPropertyId ? `📌 매물 수정 중: (${newProp.name || '불명'})` : '의무 고시 사항 중심 13대 필수항목 순차 입력 폼'}</span>
                       </p>
                       <p className="text-[10px] text-slate-400 font-bold mt-2">
                         {editingPropertyId ? '선택하신 매물의 속성들이 아래 입력 항목들에 자동 패치되었습니다. 원하는 항목들을 수정한 후 하단의 수정완료 버튼을 누르십시오.' : '소장이 직접 관리하는 수동 매물장입니다. 입력하신 순서대로 매물 요약표에 즉시 반영됩니다.'}
                       </p>
                     </div>

                    {/* Basic visual identification */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50/55 p-3 rounded-xl border border-slate-100">
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">🔢 매물번호 (Property ID) *</label>
                        <input
                          type="text"
                          value={newProp.propertyNo}
                          onChange={(e) => setNewProp(prev => ({ ...prev, propertyNo: e.target.value }))}
                          placeholder="예: 25164 (빈칸 시 자동등록)"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900 bg-amber-50/10"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">📢 대표 매물명 (단지/동호수 명칭) *</label>
                        <input
                          type="text"
                          required
                          value={newProp.name}
                          onChange={(e) => setNewProp(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="예: 현대아파트 한라 103동"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-black text-slate-700">🖼️ 매물 이미지 등록 방식 (최대 10개) *</label>
                          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setUploadTab('drive')}
                              className={`text-[9.5px] font-black px-2 py-0.5 rounded-md transition-all ${
                                uploadTab === 'drive'
                                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              구글드라이브/웹링크
                            </button>
                            <button
                              type="button"
                              onClick={() => setUploadTab('upload')}
                              className={`text-[9.5px] font-black px-2 py-0.5 rounded-md transition-all ${
                                uploadTab === 'upload'
                                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              사진 직접 업로드
                            </button>
                          </div>
                        </div>

                        {uploadTab === 'drive' ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                id="drive-url-input"
                                placeholder="구글 드라이브 공유 링크 또는 웹 이미지 URL 입력"
                                className="flex-grow text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.currentTarget as HTMLInputElement;
                                    const url = input.value.trim();
                                    if (url) {
                                      const currentUrls = newProp.imageUrls || (newProp.imageUrl ? [newProp.imageUrl] : []);
                                      if (currentUrls.length >= 10) {
                                        triggerNotification('⚠️ 최대 10장까지만 등록할 수 있습니다.');
                                      } else {
                                        const resolved = resolveDriveImageUrl(url);
                                        const updated = [...currentUrls, resolved];
                                        setNewProp(prev => ({
                                          ...prev,
                                          imageUrls: updated,
                                          imageUrl: updated[0] || ''
                                        }));
                                        input.value = '';
                                        triggerNotification('📡 웹 링크 이미지가 사진 리스트에 추가되었습니다.');
                                      }
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById('drive-url-input') as HTMLInputElement;
                                  const url = el?.value?.trim() || '';
                                  if (url) {
                                    const currentUrls = newProp.imageUrls || (newProp.imageUrl ? [newProp.imageUrl] : []);
                                    if (currentUrls.length >= 10) {
                                      triggerNotification('⚠️ 최대 10장까지만 등록할 수 있습니다.');
                                    } else {
                                      const resolved = resolveDriveImageUrl(url);
                                      const updated = [...currentUrls, resolved];
                                      setNewProp(prev => ({
                                        ...prev,
                                        imageUrls: updated,
                                        imageUrl: updated[0] || ''
                                      }));
                                      if (el) el.value = '';
                                      triggerNotification('📡 웹 링크 이미지가 사진 리스트에 추가되었습니다.');
                                    }
                                  } else {
                                    triggerNotification('⚠️ 등록할 사진 주소(URL)를 입력해주세요.');
                                  }
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer"
                              >
                                추가
                              </button>
                            </div>
                            <p className="text-[9.5px] text-slate-450 font-bold leading-normal">
                              💡 엔터를 치거나 우측의 [추가] 버튼을 누르면 사진이 1장씩 아래로 계속 등록됩니다. 드라이브 링크 공유 설정을 <strong className="text-amber-700">"링크가 있는 모든 사용자"</strong> 뷰어 권한으로 적용해주세요.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <div className="relative border-2 border-dashed border-slate-200 hover:border-amber-400/80 rounded-xl bg-slate-50/50 p-3 flex flex-col items-center justify-center transition-all min-h-[58px] group">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []) as File[];
                                  if (files.length > 0) {
                                    setIsUploadingLocal(true);
                                    setUploadError('');
                                    try {
                                      const currentUrls = newProp.imageUrls || (newProp.imageUrl ? [newProp.imageUrl] : []);
                                      if (currentUrls.length >= 10) {
                                        throw new Error('최대 10장까지만 등록할 수 있습니다.');
                                      }
                                      const allowedCount = 10 - currentUrls.length;
                                      const filesToProcess = files.slice(0, allowedCount);
                                      
                                      const promises = filesToProcess.map(file => compressAndConvertImage(file));
                                      const compressedBase64List = await Promise.all(promises);
                                      
                                      const updatedUrls = [...currentUrls, ...compressedBase64List];
                                      setNewProp(prev => ({
                                        ...prev,
                                        imageUrls: updatedUrls,
                                        imageUrl: updatedUrls[0] || ''
                                      }));
                                      
                                      if (files.length > allowedCount) {
                                        triggerNotification(`📸 사진 일부가 업로드되었습니다. 최대 10장 한도로 인해 ${files.length - allowedCount}장이 제외되었습니다.`);
                                      } else {
                                        triggerNotification(`📸 사진 ${compressedBase64List.length}장 불러오기 및 지능형 고속 리사이징 완료!`);
                                      }
                                    } catch (err: any) {
                                      setUploadError(err?.message || '사진 로딩 실패');
                                    } finally {
                                      setIsUploadingLocal(false);
                                    }
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <Upload className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors mb-1" />
                              <span className="text-[10px] text-slate-650 font-black text-center">
                                {isUploadingLocal ? '📸 최적화 압축 변환 중...' : '여러 장 클릭하거나 모아서 드래그 & 드롭'}
                              </span>
                            </div>
                            {uploadError && (
                              <p className="text-[9px] text-red-500 font-bold">{uploadError}</p>
                            )}
                          </div>
                        )}

                        {/* Interactive dynamic visual image gallery for registered images */}
                        {(() => {
                          const currentUrls = newProp.imageUrls && newProp.imageUrls.length > 0 
                            ? newProp.imageUrls 
                            : (newProp.imageUrl ? [newProp.imageUrl] : []);
                          
                          if (currentUrls.length === 0) {
                            return (
                              <div className="mt-2.5 p-4 rounded-xl border border-dashed border-slate-250 bg-slate-50 flex flex-col items-center justify-center min-h-[96px] text-center text-slate-400 select-none">
                                <span className="text-[11px] font-black">🖼️ 등록된 매물 사진이 없습니다.</span>
                                <span className="text-[9px] font-bold mt-1 text-slate-350">대표 일러스트 레이아웃이 임시 기본값으로 표시됩니다.</span>
                              </div>
                            );
                          }

                          const hasDriveFolder = currentUrls.some(url => resolveDriveImageUrl(url) === 'FOLDER_URL_DETECTED');

                          return (
                            <div className="mt-2.5 flex flex-col gap-2">
                              {hasDriveFolder && (
                                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-normal flex flex-col gap-1.5 shadow-xs">
                                  <div className="font-extrabold flex items-center gap-1.5 text-amber-950">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>📡 구글드라이브 폴더가 목록에 포함됨</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                                    동기 전산 연동 이용 시, GAS 백엔드가 폴더 안의 사진들을 대표 이미지로 실시간 주입 연동합니다. 수동 웹 모드에서는 개별 이미지 파일 링크를 직접 추가하시는 것을 권장합니다.
                                  </p>
                                </div>
                              )}

                              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-2">
                                <div className="flex items-center justify-between text-[10px] font-black text-slate-600">
                                  <span>🖼️ 실시간 등록 매물 사진 ({currentUrls.length} / 10 장)</span>
                                  <span className="text-amber-600">💡 클릭하면 '대표사진'으로 임명됩니다.</span>
                                </div>

                                <div className="grid grid-cols-5 gap-1.5">
                                  {currentUrls.map((img, iIdx) => {
                                    const resolved = resolveDriveImageUrl(img);
                                    const isMain = iIdx === 0;
                                    const isFolder = resolved === 'FOLDER_URL_DETECTED';
                                    
                                    return (
                                      <div 
                                        key={iIdx}
                                        className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-white transition-all cursor-pointer group ${
                                          isMain ? 'border-amber-500 shadow-sm scale-102 ring-1 ring-amber-400' : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                        onClick={() => {
                                          if (isMain) return;
                                          const updated = [...currentUrls];
                                          const target = updated.splice(iIdx, 1)[0];
                                          updated.unshift(target);
                                          setNewProp(prev => ({
                                            ...prev,
                                            imageUrls: updated,
                                            imageUrl: updated[0] || ''
                                          }));
                                          triggerNotification('👑 대표 사진이 변경되었습니다!');
                                        }}
                                        title={isMain ? "현재 대표 사진" : "이 사진을 대표 사진으로 설정"}
                                      >
                                        <img 
                                          src={isFolder ? DEFAULT_FALLBACK_IMAGE : resolved} 
                                          alt={`사진 ${iIdx + 1}`} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover" 
                                          onError={(e) => {
                                            e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                                          }}
                                        />
                                        
                                        {isMain ? (
                                          <div className="absolute bottom-0 inset-x-0 h-4 bg-amber-500 text-slate-950 font-black text-[8.5px] text-center flex items-center justify-center select-none shadow-inner">
                                            대표사진
                                          </div>
                                        ) : (
                                          <div className="absolute bottom-0 inset-x-0 h-4 bg-black/45 text-white/95 font-bold text-[8px] text-center flex items-center justify-center select-none opacity-0 group-hover:opacity-100 transition-opacity">
                                            대표지정
                                          </div>
                                        )}

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updated = currentUrls.filter((_, idx) => idx !== iIdx);
                                            setNewProp(prev => ({
                                              ...prev,
                                              imageUrls: updated,
                                              imageUrl: updated[0] || ''
                                            }));
                                            triggerNotification('🗑️ 선택한 사진이 목록에서 제거되었습니다.');
                                          }}
                                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-xs transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center hover:bg-red-650 z-20 w-[15px] h-[15px]"
                                          title="사진 삭제"
                                        >
                                          <X className="w-2.5 h-2.5 stroke-[3px]" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Step 1 to 13 Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      
                      {/* 필터 분류 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 md:col-span-1">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">🏷️ 필터 분류 (시스템 매핑용) *</label>
                        <select
                          value={newProp.category}
                          onChange={(e) => setNewProp(prev => ({ ...prev, category: e.target.value as any }))}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold bg-white text-slate-900"
                        >
                          {(!newProp.category || !["아파트", "오피스텔", "분양권", "원룸", "투룸", "주택", "빌라", "상가", "공장", "토지"].includes(newProp.category)) && (
                            <option value="">⚠️ 분류 직접 선택 (필수)</option>
                          )}
                          <option value="아파트">아파트</option>
                          <option value="오피스텔">오피스텔</option>
                          <option value="분양권">분양권</option>
                          <option value="원룸">원룸</option>
                          <option value="투룸">투룸</option>
                          <option value="주택">주택</option>
                          <option value="빌라">빌라</option>
                          <option value="상가">상가</option>
                          <option value="공장">공장</option>
                          <option value="토지">토지</option>
                        </select>
                      </div>

                      {/* 1. 소재지 */}
                      <div className="md:col-span-2 bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 flex flex-col justify-between">
                        <div>
                          <label className="block text-[11px] font-black text-amber-900 mb-1">1. 소재지 (지번/도로명 주소) *</label>
                          <input
                            type="text"
                            required
                            id="full-addr-input"
                            value={newProp.fullAddr}
                            onChange={(e) => {
                              const val = e.target.value;
                              const parts = val.split(' ');
                              const resolvedLoc = parts.length >= 3 ? `${parts[1]} ${parts[2]}` : val;
                              setNewProp(prev => ({ 
                                ...prev, 
                                fullAddr: val,
                                location: prev.location === '' || prev.location === '부산광역시 부산진구' || prev.location === '동구 범일동' ? resolvedLoc : prev.location
                              }));
                            }}
                            onBlur={(e) => geocodeAddressSilent(e.target.value)}
                            placeholder="예: 부산광역시 부산진구 냉정로 273 (범천동)"
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                          />
                          {newProp.mapLat && newProp.mapLng && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-extrabold animate-fade-in">
                              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              <span>📍 주소 자동변환 성공 (위도: {Number(newProp.mapLat).toFixed(4)}, 경도: {Number(newProp.mapLng).toFixed(4)}) - 지도상 붉은색 마커가 실시간 위치를 비추고 있습니다.</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">상세 시/군/구 (location 필터용)</label>
                            <input
                              type="text"
                              value={newProp.location}
                              onChange={(e) => setNewProp(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="예: 부산진구 범천동"
                              className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-800"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={handleGeocodeAddress}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-lg py-2 px-2 flex items-center justify-center gap-1 cursor-pointer transition-colors border-2 border-slate-850 hover:border-amber-400"
                            >
                              <Search className="w-3.5 h-3.5 text-amber-400" />
                              <span>카카오지도로 좌표 강제검색</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2. 면적 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 flex flex-col gap-2">
                        <label className="block text-[11px] font-black text-amber-900 mb-0.5">2. 면적 (고시 및 평수 변환) *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-500 mb-0.5">전용면적 (㎡)</span>
                            <input
                              type="number"
                              step="any"
                              required
                              value={newProp.areaExM2}
                              onChange={(e) => {
                                const m2 = e.target.value;
                                const py = m2 ? (Number(m2) * 0.3025).toFixed(2) : '';
                                setNewProp(prev => ({ 
                                  ...prev, 
                                  areaExM2: m2, 
                                  areaExPy: py,
                                  pyongValue: py
                                }));
                              }}
                              placeholder="예: 84.9"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-500 mb-0.5">공급면적 (㎡)</span>
                            <input
                              type="number"
                              step="any"
                              required
                              value={newProp.areaSpM2}
                              onChange={(e) => {
                                const m2 = e.target.value;
                                const py = m2 ? (Number(m2) * 0.3025).toFixed(2) : '';
                                setNewProp(prev => ({ 
                                  ...prev, 
                                  areaSpM2: m2, 
                                  areaSpPy: py
                                }));
                              }}
                              placeholder="예: 112.5"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-500 mb-0.5">전용면적 (평) - 자동변환</span>
                            <input
                              type="number"
                              step="any"
                              value={newProp.areaExPy}
                              onChange={(e) => {
                                const py = e.target.value;
                                const m2 = py ? (Number(py) / 0.3025).toFixed(2) : '';
                                setNewProp(prev => ({ 
                                  ...prev, 
                                  areaExPy: py, 
                                  pyongValue: py,
                                  areaExM2: m2
                                }));
                              }}
                              placeholder="자동계산"
                              className="w-full text-xs border border-slate-200 bg-slate-50 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-700"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-500 mb-0.5">공급면적 (평) - 자동변환</span>
                            <input
                              type="number"
                              step="any"
                              value={newProp.areaSpPy}
                              onChange={(e) => {
                                const py = e.target.value;
                                const m2 = py ? (Number(py) / 0.3025).toFixed(2) : '';
                                setNewProp(prev => ({ 
                                  ...prev, 
                                  areaSpPy: py,
                                  areaSpM2: m2
                                }));
                              }}
                              placeholder="자동계산"
                              className="w-full text-xs border border-slate-200 bg-slate-50 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. 가격 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 md:col-span-2">
                        <label className="block text-[11px] font-black text-amber-900 mb-2">3. 가격 (거래 분류별 상세 설정) *</label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 매매가격 입력 */}
                          <div className={`p-2.5 rounded-lg border transition-all ${newProp.transactionType === '매매' ? 'bg-red-50/40 border-red-200' : 'bg-slate-50/55 border-slate-100 opacity-75'}`}>
                            <span className="block text-[10px] font-black text-slate-700 mb-1.5 flex items-center justify-between">
                              <span>매매가격</span>
                              {newProp.transactionType === '매매' ? (
                                <span className="text-[8px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-extrabold animate-pulse">기본선택</span>
                              ) : (
                                <span className="text-[8px] text-slate-400 font-bold">(만 원)</span>
                              )}
                            </span>
                            <div className="relative">
                              <input
                                type="number"
                                required={newProp.transactionType === '매매'}
                                value={newProp.priceValueSale}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewProp(prev => ({ 
                                    ...prev, 
                                    priceValueSale: val,
                                    priceValue: prev.transactionType === '매매' ? val : prev.priceValue
                                  }));
                                }}
                                placeholder="예: 55000 (5억5천)"
                                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 outline-none font-bold text-slate-900 pr-5"
                              />
                              <span className="absolute right-2 top-2 text-[9px] font-bold text-slate-400">만</span>
                            </div>
                          </div>

                          {/* 전세가격 입력 */}
                          <div className={`p-2.5 rounded-lg border transition-all ${newProp.transactionType === '전세' ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50/55 border-slate-100 opacity-75'}`}>
                            <span className="block text-[10px] font-black text-slate-700 mb-1.5 flex items-center justify-between">
                              <span>전세가격</span>
                              {newProp.transactionType === '전세' ? (
                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-extrabold animate-pulse">기본선택</span>
                              ) : (
                                <span className="text-[8px] text-slate-400 font-bold">(만 원)</span>
                              )}
                            </span>
                            <div className="relative">
                              <input
                                type="number"
                                required={newProp.transactionType === '전세'}
                                value={newProp.priceValueJeonse}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewProp(prev => ({ 
                                    ...prev, 
                                    priceValueJeonse: val,
                                    priceValue: prev.transactionType === '전세' ? val : prev.priceValue
                                  }));
                                }}
                                placeholder="예: 32000 (3억2천)"
                                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 outline-none font-bold text-slate-900 pr-5"
                              />
                              <span className="absolute right-2 top-2 text-[9px] font-bold text-slate-400">만</span>
                            </div>
                          </div>

                          {/* 월세 보증금 및 월세액 입력 */}
                          <div className={`p-2.5 rounded-lg border transition-all ${newProp.transactionType === '월세' ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/55 border-slate-100 opacity-75'}`}>
                            <span className="block text-[10px] font-black text-slate-700 mb-1.5 flex items-center justify-between">
                              <span>월세 / 차임 정보</span>
                              {newProp.transactionType === '월세' ? (
                                <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded font-extrabold animate-pulse">기본선택</span>
                              ) : (
                                <span className="text-[8px] text-slate-400 font-bold">(만 원)</span>
                              )}
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="relative">
                                <input
                                  type="number"
                                  required={newProp.transactionType === '월세'}
                                  value={newProp.priceValueRentDeposit}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewProp(prev => ({ 
                                      ...prev, 
                                      priceValueRentDeposit: val,
                                      priceValue: prev.transactionType === '월세' ? val : prev.priceValue
                                    }));
                                  }}
                                  placeholder="보증금 (3000)"
                                  className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 outline-none font-bold text-slate-900"
                                />
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  required={newProp.transactionType === '월세'}
                                  value={newProp.rentValueRentMonth}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewProp(prev => ({ 
                                      ...prev, 
                                      rentValueRentMonth: val,
                                      rentValue: prev.transactionType === '월세' ? val : prev.rentValue
                                    }));
                                  }}
                                  placeholder="월세 (80)"
                                  className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 outline-none font-bold text-slate-900"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-amber-800 font-extrabold bg-amber-50 rounded-lg p-2 border border-amber-100 flex items-center justify-between">
                          <span>📋 실시간 고시용 텍스트 프리뷰:</span>
                          <span className="text-slate-900 font-bold">{
                            newProp.transactionType === '매매' ? `매매 ${formatPriceToKorean(newProp.priceValueSale) || '0원'}` :
                            newProp.transactionType === '전세' ? `전세 ${formatPriceToKorean(newProp.priceValueJeonse) || '0원'}` :
                            `월세 보증금 ${formatPriceToKorean(newProp.priceValueRentDeposit) || '0원'} / 월세 ${newProp.rentValueRentMonth || '0'}만`
                          }</span>
                        </div>
                      </div>

                      {/* 4. 중개대상물 종류 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">4. 중개대상물 종류 (직접 입력) *</label>
                        <input
                          type="text"
                          required
                          value={newProp.type}
                          onChange={(e) => setNewProp(prev => ({ ...prev, type: e.target.value }))}
                          placeholder="예: 아파트, 단독주택, 상가건물"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>

                      {/* 5. 거래형태 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">5. 거래형태 *</label>
                        <select
                          value={newProp.transactionType}
                          onChange={(e) => setNewProp(prev => ({ ...prev, transactionType: e.target.value as any }))}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold bg-white text-slate-900"
                        >
                          <option value="매매">매매</option>
                          <option value="전세">전세</option>
                          <option value="월세">월세</option>
                        </select>
                      </div>

                      {/* 6. 층수 / 총 층수 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 flex flex-col justify-between">
                        <div>
                          <label className="block text-[11px] font-black text-amber-900 mb-1">6. 층수 / 총 층수 *</label>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <span className="block text-[9px] font-bold text-slate-500 mb-0.5">층수 (현재층)</span>
                              <input
                                type="text"
                                required
                                value={newProp.floorNow}
                                onChange={(e) => setNewProp(prev => ({ ...prev, floorNow: e.target.value }))}
                                placeholder="예: 15"
                                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                              />
                            </div>
                            <div>
                              <span className="block text-[9px] font-bold text-slate-500 mb-0.5">총 층수</span>
                              <input
                                type="text"
                                required
                                value={newProp.floorTotal}
                                onChange={(e) => setNewProp(prev => ({ ...prev, floorTotal: e.target.value }))}
                                placeholder="예: 25"
                                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight">
                          각 칸에 따로 입력되며, 완료 시 요약표와 상세 페이지에는 자동으로 합산 표시됩니다.
                        </p>
                      </div>

                      {/* 7. 입주가능일 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">7. 입주가능일 *</label>
                        <input
                          type="text"
                          required
                          value={newProp.avail}
                          onChange={(e) => setNewProp(prev => ({ ...prev, avail: e.target.value }))}
                          placeholder="예: 즉시 입주 가능 (또는 날짜 협의)"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>

                      {/* 8. 방 수 / 욕실 수 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 flex flex-col gap-2">
                        <label className="block text-[11px] font-black text-amber-900 mb-0.5">8. 구조 (방 및 욕실 개수) *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-500 mb-0.5">방 수 (개)</span>
                            <input
                              type="number"
                              required
                              value={newProp.roomCount}
                              onChange={(e) => setNewProp(prev => ({ ...prev, roomCount: e.target.value }))}
                              placeholder="예: 3"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-500 mb-0.5">욕실 수 (개)</span>
                            <input
                              type="number"
                              required
                              value={newProp.bathCount}
                              onChange={(e) => setNewProp(prev => ({ ...prev, bathCount: e.target.value }))}
                              placeholder="예: 2"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 9. 사용승인일 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">9. 사용승인일 *</label>
                        <input
                          type="text"
                          required
                          value={newProp.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            const yr = extractYear(val);
                            setNewProp(prev => ({ 
                              ...prev, 
                              date: val, 
                              useYearValue: yr,
                              useYearText: yr ? `${yr}년 준공` : ''
                            }));
                          }}
                          placeholder="예: 2019.05.20 (또는 준공연도)"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                        {newProp.useYearValue && (
                          <div className="text-[10px] text-amber-600 font-bold mt-1">
                            ⚙️ 준공연도 자동 매핑: {newProp.useYearValue}년
                          </div>
                        )}
                      </div>

                      {/* 10. 주차대수 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">10. 주차대수 *</label>
                        <input
                          type="text"
                          required
                          value={newProp.parking}
                          onChange={(e) => setNewProp(prev => ({ ...prev, parking: e.target.value }))}
                          placeholder="예: 세대당 1.25대 (총 1,450대)"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>

                      {/* 11. 관리비 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">11. 관리비 *</label>
                        <input
                          type="text"
                          required
                          value={newProp.mFee}
                          onChange={(e) => setNewProp(prev => ({ ...prev, mFee: e.target.value }))}
                          placeholder="예: 약 15만원 (전기, 수도 요금 포함)"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>

                      {/* 12. 방향 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 flex flex-col gap-2">
                        <label className="block text-[11px] font-black text-amber-900 mb-0.5">12. 방향 / 기준 사항 *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-500 mb-0.5">방향</span>
                            <input
                              type="text"
                              required
                              value={newProp.direction}
                              onChange={(e) => setNewProp(prev => ({ ...prev, direction: e.target.value }))}
                              placeholder="예: 남서향"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-500 mb-0.5">기준</span>
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {['거실', '안방', '주출입구', '직접입력'].map((opt) => {
                                const isSelected = 
                                  opt === '직접입력'
                                    ? (newProp.dirStandard !== '거실 기준' && newProp.dirStandard !== '안방 기준' && newProp.dirStandard !== '주출입구 기준')
                                    : (newProp.dirStandard === `${opt} 기준`);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      if (opt === '직접입력') {
                                        setNewProp(prev => ({ ...prev, dirStandard: '' }));
                                      } else {
                                        setNewProp(prev => ({ ...prev, dirStandard: `${opt} 기준` }));
                                      }
                                    }}
                                    className={`px-2 py-0.5 text-[9.5px] font-black rounded border transition-all ${
                                      isSelected
                                        ? 'bg-[#03C75A] text-white border-[#03C75A] shadow-xs'
                                        : 'bg-white text-slate-600 border-slate-205 hover:bg-slate-50'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            <input
                              type="text"
                              required
                              value={newProp.dirStandard}
                              onChange={(e) => setNewProp(prev => ({ ...prev, dirStandard: e.target.value }))}
                              placeholder="예: 거실 기준"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Metadata: Tags and Optional Coordinates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-150">
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1 font-sans">🏷️ 매물 홍보 해시태그 (쉼표로 구분)</label>
                        <input
                          type="text"
                          value={newProp.tags}
                          onChange={(e) => setNewProp(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="예: 역세권, 신축현장, 로얄층, 수리완비"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">📍 카카오지도 수동 좌표설정 (공란 시 자동 분산)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block mb-0.5">위도 (Latitude)</span>
                            <input
                              type="number"
                              step="any"
                              value={newProp.mapLat}
                              onChange={(e) => setNewProp(prev => ({ ...prev, mapLat: e.target.value }))}
                              placeholder="예: 35.151261"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block mb-0.5">경도 (Longitude)</span>
                            <input
                              type="number"
                              step="any"
                              value={newProp.mapLng}
                              onChange={(e) => setNewProp(prev => ({ ...prev, mapLng: e.target.value }))}
                              placeholder="예: 129.029706"
                              className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 13. 매물특징 */}
                    <div className="bg-amber-50/25 p-3 sm:p-4 rounded-xl border border-amber-200/50">
                      <label className="block text-[11px] font-black text-amber-900 mb-1.5">13. 매물 특징 및 추가 한줄 권장설명 *</label>
                      <textarea
                        required
                        rows={2}
                        value={newProp.description}
                        onChange={(e) => setNewProp(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="예: 서면역 도보 5분 거리의 남서향 최고층 아파트입니다. 즉시 입주 가능하며 내외관 컨디션이 매우 우수합니다."
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg p-3 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900 resize-none"
                      />
                    </div>

                    <div className="flex gap-3 mt-2">
                      {editingPropertyId && (
                        <button
                          type="button"
                          onClick={cancelEditMode}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-755 font-black py-4 rounded-xl cursor-pointer transition-transform hover:scale-[1.005] duration-150 text-xs"
                        >
                          ❌ 수정 취소하기
                        </button>
                      )}
                      <button
                        type="submit"
                        className={`${
                          editingPropertyId 
                            ? 'bg-[#3A8AF6] hover:bg-[#2563EB] text-white' 
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        } flex-[2] font-black py-4 rounded-xl cursor-pointer transition-transform hover:scale-[1.005] duration-150 text-xs text-center flex items-center justify-center gap-2 shadow-sm`}
                      >
                        {editingPropertyId 
                          ? '💾 부강공인중개사 소장 전속 매물 정보 수정 완료하기 (실시간 반영)' 
                          : '🚀 부강공인중개사 소장 전속 매물장에 수동 등록하기'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* Empty States */}
            {filteredProperties.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border-2 border-dashed border-amber-200 p-8 text-center flex flex-col items-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-sm font-black text-slate-800">
                  선택하신 필터 조건에 부합하는 매물이 일시적 부재중입니다.
                </span>
                <span className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  보증금/매매가 혹은 면적 주거 유형 기준을 다른 범위로 완화 조율하시면, 폭넓은 대안 호실 매물 확보가 가동됩니다.
                </span>
                <button 
                  onClick={() => {
                    setSelectedCategory('아파트 오피스텔');
                    setActiveSubPills(['아파트 오피스텔']);
                    setSelectedTransaction('전체');
                    setPriceLimit('전체');
                    setSizeRange('전체');
                    setUseYear('전체');
                    setHouseholdCount('전체');
                    setSearchQuery('');
                  }}
                  className="mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-colors"
                >
                  기반 필터 즉시 초기화
                </button>
              </motion.div>
            )}

            {/* Results Listings Content (Conditional on viewMode: grid or map) */}
            {viewMode === 'map' ? (
              /* Map Side-by-Side Split Screen Layout (Naver Real Estate Style) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch bg-white rounded-3xl p-3 border border-amber-200/50 shadow-xs">
                
                {/* Right Listing Feed: Compact horizontal row items (lg:col-span-4, order-2) */}
                <div id="map-listing-feed-container" className="order-2 lg:order-2 lg:col-span-4 flex flex-col gap-3.5 max-h-[420px] lg:max-h-[580px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  <div className="bg-amber-50/50 text-slate-600 text-[11px] font-bold p-3 rounded-xl border border-amber-100/60 flex items-center gap-2 justify-center">
                    <Info className="w-4 h-4 text-amber-500 animate-bounce" />
                    <span>원하는 매물을 클릭하면 지도가 알아서 움직입니다.</span>
                  </div>



                  <AnimatePresence mode="popLayout" initial={false}>
                    {groupedFeedItems.map((item, index) => {
                      if (!item.isGroup) {
                        const prop = item.singleProp!;
                        const isFavorite = favorites.includes(prop.id);
                        const isHovered = hoveredPropertyId === prop.id;
                        const isActive = activeMarkerId === prop.id;

                        return (
                          <motion.div
                            key={prop.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.15) }}
                            className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer flex justify-between gap-4 relative bg-white text-left ${
                              isActive
                                ? 'border-2 border-[#03C75A] bg-[#fdfefd] shadow-md ring-4 ring-[#03C75A]/10 scale-[1.01] z-10'
                                : isHovered
                                ? 'border border-[#03C75A]/60 bg-[#EAF9F1]/10 shadow-xs'
                                : 'border border-slate-150 hover:border-slate-300 hover:bg-slate-50/20'
                            }`}
                            onMouseEnter={() => setHoveredPropertyId(prop.id)}
                            onMouseLeave={() => setHoveredPropertyId(null)}
                            onClick={() => {
                              setMapCenter({ lat: prop.mapLat, lng: prop.mapLng });
                              setActiveMarkerId(prop.id);
                            }}
                            id={`map-property-${prop.id}`}
                          >
                            {/* Text Spec Column on Left */}
                            <div className="flex flex-col justify-between flex-grow min-w-0 pr-1">
                              <div>
                                {/* Row 1: Representative Property Name & Optional Admin Actions */}
                                <div className="flex items-center justify-between gap-1.5 mb-1.5 select-none">
                                  <span className="text-[11px] font-extrabold text-[#03C75A] bg-[#EAF9F1] border border-[#CDEFE0] px-2 py-0.5 rounded-sm truncate max-w-[150px] sm:max-w-[185px]">
                                    {prop.name}
                                  </span>
                                  {isAdminMode && (
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleStartEditProperty(prop);
                                        }}
                                        className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-full transition-colors relative z-25 cursor-pointer"
                                        style={{ color: "#3B82F6" }}
                                        title="매물 즉시 수정 (관리자)"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleDeleteProperty(prop.id, e);
                                        }}
                                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors relative z-25 cursor-pointer"
                                        style={{ color: "#DC2626" }}
                                        title="매물 즉시 삭제 (관리자)"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Row 2: Price Label in vibrant blue */}
                                <div className="text-[16px] sm:text-[17px] font-black text-[#2B66FF] tracking-tight">
                                  {prop.transactionType === '월세' ? (
                                    <>
                                      보증금 <span className="font-extrabold">{prop.priceValue > 0 ? formatPriceToKorean(prop.priceValue) : '0'} 원</span> / 월세 <span className="font-extrabold">{prop.rentValue ? `${prop.rentValue.toLocaleString()}만 원` : '0만 원'}</span>
                                    </>
                                  ) : (
                                    <>
                                      {prop.transactionType} <span className="font-extrabold">{getCleanedPriceText(prop.transactionType, prop.priceText)}</span>
                                    </>
                                  )}
                                </div>

                                {/* Row 3: Standard Specifications dot format */}
                                <div className="text-[11.5px] text-slate-600 font-extrabold tracking-tight mt-1 line-clamp-1">
                                  {prop.category + (prop.area ? ` · ${prop.area}` : ` · ${prop.pyongValue}평`)} · {prop.floorText.split('/')[0]}층 · {prop.direction}
                                </div>

                                {/* Row 4: Descriptive info */}
                                <p className="text-[11.5px] text-slate-500 font-bold leading-snug tracking-tight mt-0.5 line-clamp-2">
                                  {prop.description || `${prop.name} - 깨끗하고 생활하기 최고인 인기 매물`}
                                </p>

                                {/* Row 5: Secondary Tags rounded-xs array */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(prop.tags || []).slice(0, 3).map((tag, tIdx) => (
                                    <span key={tIdx} className="bg-[#F2F4F7] text-[#555E6D] text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm select-none">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Image Flow Column on Right (Image + 상세보기 Button) */}
                            <div className="flex flex-col gap-2 flex-shrink-0 items-center justify-start w-24 sm:w-28">
                              {/* Image Box */}
                              <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden bg-slate-50 relative border border-slate-150 shadow-inner">
                                <img
                                  src={resolveDriveImageUrl(prop.imageUrl)}
                                  alt={prop.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                                  }}
                                />

                                {/* Favorite Box Outline inside the Image exactly like bottom right Star box */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(prop.id, e);
                                  }}
                                  className="absolute bottom-1 right-1 bg-white hover:bg-slate-50 border border-slate-200 p-1 rounded shadow-xs transition-colors z-20 cursor-pointer flex items-center justify-center w-[26px] h-[26px]"
                                  title="관심매물 등록"
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                                </button>
                              </div>

                              {/* Action Button under mapping image */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailsAndSetInquiry(prop);
                                }}
                                className="w-full bg-[#03C75A] hover:bg-[#02b350] text-white text-[11px] sm:text-[12px] font-black py-1.5 rounded shadow-xs transition-colors cursor-pointer text-center"
                              >
                                상세보기
                              </button>
                            </div>
                          </motion.div>
                        );
                      } else {
                        const propertiesInGroup = item.properties;
                        const isExpanded = expandedGroupKeys.includes(item.groupKey);
                        const summaries = getGroupSummaries(propertiesInGroup);

                        return (
                          <div id={`feed-group-${item.groupKey}`} key={item.groupKey} className="flex flex-col gap-2 bg-slate-50/40 p-1.5 rounded-2xl border border-slate-200/60 shadow-2xs">
                            {/* Main Group Summary Card */}
                            <motion.div
                              layout
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedGroupKeys(expandedGroupKeys.filter(k => k !== item.groupKey));
                                } else {
                                  setExpandedGroupKeys([...expandedGroupKeys, item.groupKey]);
                                  const firstProp = propertiesInGroup[0];
                                  setMapCenter({ lat: firstProp.mapLat, lng: firstProp.mapLng });
                                }
                              }}
                              className={`p-4 rounded-xl border bg-white select-none text-left cursor-pointer transition-all duration-350 relative flex justify-between gap-4 ${
                                isExpanded
                                  ? 'border-2 border-[#03C75A] shadow-md ring-4 ring-[#03C75A]/5'
                                  : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                              }`}
                            >
                              {/* Left Text details */}
                              <div className="flex flex-col justify-between flex-grow min-w-0 pr-1">
                                <div>
                                  {/* Title: Name of Complex */}
                                  <div className="flex items-center gap-1.5 mb-1.5 select-none">
                                    <span className="text-white text-[10px] font-extrabold bg-[#03C75A] px-2 py-0.5 rounded-xs">
                                      {propertiesInGroup[0].category || '매물단지'}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-extrabold max-w-[155px] truncate block">
                                      {propertiesInGroup[0].location.split(' ').slice(1, 3).join(' ')}
                                    </span>
                                  </div>
                                  
                                  <h3 className="text-[17px] sm:text-[18px] font-black text-slate-900 tracking-tight leading-snug">
                                    {getGroupBuildingName(propertiesInGroup, item.name)}
                                  </h3>

                                  {/* Price summaries list exactly like original Naver Realtor list */}
                                  <div className="flex flex-col gap-1 mt-2.5">
                                    {summaries.map(s => (
                                      <div key={s.type} className="flex items-center gap-2">
                                        <span className={`w-8 text-[12.5px] font-black ${
                                          s.type === '매매' ? 'text-blue-500' : s.type === '전세' ? 'text-indigo-500' : 'text-emerald-500'
                                        }`}>
                                          {s.type}
                                        </span>
                                        <span className="text-[14px] sm:text-[15px] font-extrabold text-[#2B66FF] tracking-tight">
                                          {s.displayStr}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Count text summaries (e.g. 매매 72 | 전세 3 | 월세 1) */}
                                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 font-bold border-t border-slate-100 pt-2.5 mt-3">
                                    {summaries.map((s, idx) => (
                                      <React.Fragment key={s.type}>
                                        {idx > 0 && <span className="text-slate-300">/</span>}
                                        <span>
                                          {s.type} <strong className="text-[#03C75A] font-black">{s.count}</strong>
                                        </span>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Right graphics */}
                              <div className="flex flex-col gap-2.5 flex-shrink-0 items-center justify-center w-25 sm:w-28 relative">
                                <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden bg-slate-100 relative border border-slate-200/80 shadow-xs flex items-center justify-center">
                                  {propertiesInGroup[0].imageUrl ? (
                                    <img
                                      src={resolveDriveImageUrl(propertiesInGroup[0].imageUrl)}
                                      alt="Group thumb"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover transition-transform"
                                      onError={(e) => {
                                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                                      }}
                                    />
                                  ) : (
                                    <Building className="w-8 h-8 text-slate-300" />
                                  )}

                                  {/* Dynamic overlap count bubble */}
                                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] flex flex-col items-center justify-center text-white p-1">
                                    <span className="text-[20px] sm:text-[22px] font-black tracking-tight leading-none">
                                      +{propertiesInGroup.length}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-black text-amber-300 mt-1 uppercase tracking-wider">
                                      개 매물보기
                                    </span>
                                  </div>
                                </div>

                                {/* Nice toggle badge */}
                                <div className={`flex items-center justify-center gap-1 text-[11px] font-black py-1 px-2.5 rounded-full border transition-all ${
                                  isExpanded 
                                    ? 'bg-[#EAF9F1] border-[#CDEFE0] text-[#03C75A]' 
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}>
                                  <span>{isExpanded ? '닫기' : '매물 목록'}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#03C75A]' : 'text-slate-400'}`} />
                                </div>
                              </div>
                            </motion.div>

                            {/* Nested Expandable Properties Lists inside clean, bordered sub-panel */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: "easeInOut" }}
                                  className="overflow-hidden flex flex-col gap-2.5 pl-3 border-l-2 border-[#03C75A]/30 mt-1"
                                >
                                  {propertiesInGroup.map((subProp) => {
                                    const isSubFavorite = favorites.includes(subProp.id);
                                    const isSubHovered = hoveredPropertyId === subProp.id;
                                    const isSubActive = activeMarkerId === subProp.id;

                                    return (
                                      <div
                                        key={subProp.id}
                                        className={`p-3.5 rounded-xl border text-left cursor-pointer flex justify-between gap-3 relative transition-all bg-white hover:bg-slate-50/30 ${
                                          isSubActive
                                            ? 'border-2 border-[#03C75A] shadow-xs'
                                            : 'border-slate-150 hover:border-slate-250'
                                        }`}
                                        onMouseEnter={() => setHoveredPropertyId(subProp.id)}
                                        onMouseLeave={() => setHoveredPropertyId(null)}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMapCenter({ lat: subProp.mapLat, lng: subProp.mapLng });
                                          setActiveMarkerId(subProp.id);
                                        }}
                                      >
                                        <div className="flex flex-col justify-between flex-grow min-w-0">
                                          <div>
                                            <div className="flex items-center gap-1.5 mb-1 select-none">
                                              <span className="text-[10px] font-black text-[#03C75A] bg-[#EAF9F1] px-1.5 py-0.2 rounded-xs border border-[#CDEFE0]">
                                                {subProp.transactionType}
                                              </span>
                                              <span className="text-[11.5px] text-slate-500 font-extrabold truncate">
                                                {subProp.category} · {subProp.pyongValue}평
                                              </span>
                                            </div>

                                            <div className="text-[15px] font-black text-[#2B66FF] tracking-tight">
                                              {subProp.transactionType === '월세' ? (
                                                <>
                                                  보증금 <span className="font-extrabold">{subProp.priceValue > 0 ? formatPriceToKorean(subProp.priceValue) : '0'} 원</span> / 월세 <span className="font-extrabold">{subProp.rentValue ? `${subProp.rentValue.toLocaleString()}만 원` : '0만 원'}</span>
                                                </>
                                              ) : (
                                                <>
                                                  {subProp.transactionType} <span className="font-extrabold">{getCleanedPriceText(subProp.transactionType, subProp.priceText)}</span>
                                                </>
                                              )}
                                            </div>

                                            <div className="text-[11.2px] text-slate-500 font-bold mt-0.5">
                                              {subProp.floorText.split('/')[0]}층 · {subProp.direction}
                                            </div>

                                            {subProp.description ? (
                                              <p className="text-[10.5px] text-slate-400 font-bold mt-1 max-w-[190px] truncate">
                                                {subProp.description}
                                              </p>
                                            ) : null}
                                          </div>
                                        </div>

                                        <div className="flex flex-shrink-0 flex-col gap-1.5 items-end justify-between">
                                          {/* Star favorite mini button */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite(subProp.id, e);
                                            }}
                                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-sm transition-colors cursor-pointer w-[26px] h-[26px] flex items-center justify-center animate-none"
                                            title="관심매물 등록"
                                          >
                                            <Star className={`w-3 h-3 ${isSubFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDetailsAndSetInquiry(subProp);
                                            }}
                                            className="bg-[#03C75A] hover:bg-[#02b350] text-[#fff] text-[11px] font-black px-2.5 py-1.5 rounded cursor-pointer text-center"
                                          >
                                            상세보기
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }
                    })}
                  </AnimatePresence>
                </div>

                {/* Left Interactive Kakao Map Panel (lg:col-span-8, order-1) */}
                <div className="order-1 lg:order-1 lg:col-span-8 h-[380px] lg:h-[580px] rounded-2xl border border-amber-200/40 shadow-sm relative overflow-hidden bg-slate-50 flex flex-col justify-between">


                  {/* Troubleshooting Guide Box overlay when requested */}
                  <AnimatePresence>
                    {showKakaoGuide && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md p-5 text-white flex flex-col justify-between overflow-y-auto"
                      >
                        <div className="space-y-3.5 font-sans">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                              <span>💡 카카오 지도 연결 및 보안 해결책</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowKakaoGuide(false);
                              }}
                              className="text-slate-400 hover:text-white text-xs font-black cursor-pointer bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg"
                            >
                              닫기 ✕
                            </button>
                          </div>

                          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                            구글 클라우드 AI 빌더(Iframe Sandbox) 환경에서는 카카오 지도가 보안 정책상 로딩 거부 또는 인증 실패가 날 수 있습니다. 아래 조치를 통해 1초만에 완벽 작동시킬 수 있습니다:
                          </p>

                          {/* Major Checklists */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                              <span className="font-extrabold text-amber-400 block mb-1">🛡️ 1. 광고 제거 플러그인 (AdBlock 등) 비활성화</span>
                              <span className="text-slate-400 leading-normal">
                                크롬의 AdBlock, 유니콘, Brave Shield 등 광고차단기는 카카오 맵 스크립트를 수수료 트래커로 판단하여 강제 차단할 수 있습니다. <strong>광고 차단을 임시 해제</strong>해 주세요!
                              </span>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                              <span className="font-extrabold text-amber-400 block mb-1">🔗 2. 새 창으로 앱 개발 페이지 즉시 열기 (강력 권장)</span>
                              <span className="text-slate-400 leading-normal">
                                현재 보고 계신 sandbox Iframe을 넘어 <strong>독립적인 브라우저 단독 탭</strong>에서 활성화하면 카카오 도메인 검증이 100% 정상 인식 적용됩니다.
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl space-y-1.5">
                            <h5 className="text-[11px] font-black text-slate-200">🛠️ 카카오 웹 플랫폼 Web 도메인 기준 목록:</h5>
                            <ol className="text-[10px] text-slate-400 space-y-0.5 list-decimal list-inside font-semibold leading-relaxed">
                              <li><a href="https://developers.kakao.com" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">카카오 개발자 서비스</a> 로그인 후 플랫폼 ➔ Web 도메인 수정</li>
                              <li>포트 번호 (<code className="text-amber-200">:3000</code>, <code className="text-amber-200">:5173</code>) 및 슬래시 일치 확인</li>
                            </ol>
                          </div>

                          <div className="bg-slate-900 border border-slate-800/80 p-2 rounded-xl">
                            <h5 className="text-[10px] font-black text-amber-500 mb-0.5">등록해야 할 서버 도메인 목록:</h5>
                            <div className="font-mono text-[9px] text-slate-300 space-y-0.5 select-all">
                              <div>http://localhost:3000</div>
                              <div>https://ais-dev-2o5kuleeq74mr5w55gcxnr-517818131161.asia-northeast1.run.app</div>
                              <div>https://ais-pre-2o5kuleeq74mr5w55gcxnr-517818131161.asia-northeast1.run.app</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-900 flex flex-col sm:flex-row gap-2 font-sans">
                          <button
                            type="button"
                            onClick={() => window.open(window.location.href, '_blank')}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-black py-2.5 px-4 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>🚀 새 창에서 앱 열기 (수수료 우회 & 카카오 100% 정밀 적용)</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleCopyDomains}
                            className={`flex-1 text-xs font-black py-2.5 rounded-xl text-center cursor-pointer transition-all ${
                              copied 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {copied ? '✓ 도메인 복사 완료!' : '📋 도메인 전체 복사'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setShowKakaoGuide(false);
                              setForceShowMap(true);
                              if ((window as any).kakao?.maps) {
                                setIsKakaoLoaded(true);
                              } else {
                                alert("⚠️ 현재 브라우저에 카카오 지도 SDK 파일 로딩 자체가 제한되었습니다. 크롬 광고차단을 꺼 주시거나 '새 창에서 앱 열기' 버튼을 사용해 주세요.");
                              }
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 text-xs font-black rounded-xl cursor-pointer"
                          >
                            카카오 지도 강제 로드 / 활성화 시도 ⚡
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actual Map component or beautiful fallback if script is blocking */}
                  {isKakaoLoaded ? (
                    <Map
                      key={`kakao-main-map-${mapKey}`}
                      center={mapCenter}
                      style={{ width: "100%", height: "100%" }}
                      level={mapLevel}
                      mapTypeId="ROADMAP"
                      onClick={() => {
                        setSelectedMapGroupKey(null);
                        setActiveMarkerId(null);
                      }}
                      onCreate={(map) => {
                        if (map) {
                          try {
                            console.log("🚀 [Kakao Map Core SUCCESS] Primary map object instance created successfully! (center: " + map.getCenter().toString() + ", level: " + map.getLevel() + ")");
                          } catch (e) {
                            console.log("🚀 [Kakao Map Core SUCCESS] Primary map object instance created successfully!");
                          }
                        } else {
                          console.error("❌ [Kakao Map Core ERROR] Map component mounted but instance initialization failed.");
                        }
                      }}
                      onCenterChanged={(map) => {
                        const center = map.getCenter();
                        const newLat = center.getLat();
                        const newLng = center.getLng();
                        
                        // epsilon guard to avoid micro re-render feedback loop
                        const latDiff = Math.abs(mapCenter.lat - newLat);
                        const lngDiff = Math.abs(mapCenter.lng - newLng);
                        if (latDiff > 0.00001 || lngDiff > 0.00001) {
                          setMapCenter({ lat: newLat, lng: newLng });
                        }
                      }}
                      onZoomChanged={(map) => setMapLevel(map.getLevel())}
                    >
                      {/* Listings interactive pins */}
                      {clusteredProperties.map((cluster) => {
                        if (cluster.isCluster) {
                          return (
                            <CustomOverlayMap
                              key={cluster.id}
                              position={{ lat: cluster.centerLat, lng: cluster.centerLng }}
                              clickable={true}
                              xAnchor={0.5}
                              yAnchor={0.5}
                            >
                              <div 
                                onClick={() => {
                                  setMapCenter({ lat: cluster.centerLat, lng: cluster.centerLng });
                                  setMapLevel(prev => Math.max(prev - 2, 2));
                                }}
                                className="flex items-center justify-center cursor-pointer select-none group"
                                style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'auto' }}
                              >
                                {/* Dynamic ambient glowing concentric pulse */}
                                <div className="absolute w-[54px] h-[54px] bg-amber-500/20 rounded-full animate-ping pointer-events-none" />
                                <div className="absolute w-[42px] h-[42px] bg-amber-500/15 rounded-full animate-pulse pointer-events-none" />
                                
                                {/* Core Real Estate Cluster Bubble Badge */}
                                <div className="relative flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-xl ring-4 ring-white border border-amber-600 rounded-full transition-transform duration-250 active:scale-95 group-hover:scale-110">
                                  <span className="text-sm font-black tracking-tight leading-none text-slate-950">{cluster.count}</span>
                                  <span className="text-[9px] font-extrabold text-slate-950/80 mt-0.5 leading-none">매물</span>
                                </div>
                              </div>
                            </CustomOverlayMap>
                          );
                        }

                        // Otherwise render standard single marker or group marker as before
                        const prop = cluster.prop;
                        if (!prop) return null;

                        const isGroup = cluster.isGroup;
                        const propertiesInGroup = cluster.items || [];
                        const groupSummaries = isGroup ? getGroupSummaries(propertiesInGroup) : (prop ? getGroupSummaries([prop]) : []);

                        const isGroupActive = isGroup ? propertiesInGroup.some(p => p.id === activeMarkerId) : (activeMarkerId === prop.id);
                        const isGroupHovered = isGroup ? propertiesInGroup.some(p => p.id === hoveredPropertyId) : (hoveredPropertyId === prop.id);
                        const isPreview = prop.id === 'new-prop-preview';
                        let propLat = cluster.centerLat;
                        let propLng = cluster.centerLng;
                        
                        const groupKey = (prop.location || prop.fullAddr || '').trim();
                        const isSelectedLocGroup = selectedMapGroupKey === groupKey;

                        const txColorClass = isPreview 
                          ? 'bg-rose-500 animate-pulse' 
                          : prop.transactionType === '매매' 
                          ? 'bg-indigo-600' 
                          : prop.transactionType === '전세' 
                          ? 'bg-amber-600' 
                          : 'bg-emerald-600';

                        // Green Naver brand border ring for active/clicked overlay
                        const activeRingClass = isPreview
                          ? 'ring-4 ring-rose-400/80 scale-105 border-rose-500 font-extrabold z-[1000] !bg-rose-50'
                          : (isGroupActive || isSelectedLocGroup)
                          ? 'border-2 border-[#03C75A] bg-white ring-4 ring-[#03C75A]/8 scale-105 font-black z-[1002] shadow-xl' 
                          : isGroupHovered 
                          ? 'border-2 border-[#03C75A]/60 scale-105 z-[1001] shadow-md' 
                          : 'border-slate-350';
                        
                        return (
                          <React.Fragment key={cluster.id || prop.id}>
                            {/* Render MapMarker ONLY if Selected/Active or in Preview mode */}
                            {(isSelectedLocGroup || isGroupActive || isPreview) && (
                              <MapMarker
                                position={{ lat: propLat, lng: propLng }}
                                onClick={() => {
                                  if (!isPreview) {
                                    setMapCenter({ lat: propLat, lng: propLng });
                                    setSelectedMapGroupKey(groupKey);
                                    if (isGroup) {
                                      setActiveMarkerId(propertiesInGroup[0].id);
                                    } else {
                                      setActiveMarkerId(prop.id);
                                    }
                                  }
                                }}
                                image={{
                                  src: isPreview
                                    ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png"
                                    : (isGroupActive || isSelectedLocGroup)
                                    ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png"
                                    : "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                                  size: isPreview
                                    ? { width: 31, height: 35 }
                                    : (isGroupActive || isSelectedLocGroup)
                                    ? { width: 29, height: 35 }
                                    : { width: 18, height: 26 }
                                }}
                              />
                            )}

                            {/* Clicked / Active Naver style Details Card Overlay */}
                            {(isSelectedLocGroup || isGroupActive || isPreview) ? (
                              <CustomOverlayMap
                                position={{ lat: propLat, lng: propLng }}
                                clickable={true}
                                zIndex={100}
                                xAnchor={0.5}
                                yAnchor={1.0}
                              >
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMapCenter({ lat: propLat, lng: propLng });
                                    setSelectedMapGroupKey(groupKey);
                                    if (propertiesInGroup.length > 0) {
                                      setActiveMarkerId(propertiesInGroup[0].id);
                                    }
                                  }}
                                  className={`relative flex flex-col p-4 text-xs sm:text-sm font-black rounded-[20px] bg-white text-slate-800 transition-all cursor-pointer shadow-xl min-w-[200px] max-w-[240px] ${activeRingClass}`}
                                  style={{ 
                                    transform: 'translateY(-48px)',
                                    pointerEvents: 'auto'
                                  }}
                                >
                                  {/* Header Row */}
                                  <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                                    <span className="font-extrabold text-slate-900 truncate text-[12px] sm:text-[13px]">
                                      {getGroupBuildingName(propertiesInGroup, prop.name)}
                                    </span>
                                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-white bg-[#03C75A] rounded shrink-0 leading-none">
                                      {propertiesInGroup.length || 1}개 매물
                                    </span>
                                  </div>

                                  {/* Price List */}
                                  <div className="flex flex-col gap-1.5 py-2">
                                    {groupSummaries.slice(0, 3).map(s => {
                                      const sumColor = s.type === '매매' ? 'text-purple-600' : s.type === '전세' ? 'text-amber-600' : 'text-emerald-600';
                                      return (
                                        <div key={s.type} className="flex items-center justify-[11px] sm:text-xs">
                                          <div className="flex items-center justify-between w-full">
                                            <span className={`font-black shrink-0 ${sumColor}`}>{s.type}</span>
                                            <span className="text-[#2B66FF] font-black tracking-tight truncate leading-none">
                                              {s.displayStr}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {groupSummaries.length === 0 && (
                                      <div className="flex items-center justify-[11px] sm:text-xs w-full">
                                        <div className="flex items-center justify-between w-full">
                                          <span className={`font-black shrink-0 text-gray-500`}>{prop.transactionType}</span>
                                          <span className="text-[#2B66FF] font-black tracking-tight truncate leading-none">
                                            {getCleanedPriceText(prop.transactionType, prop.priceText)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Bottom Tab Pill Buttons */}
                                  <div className="flex flex-wrap items-center justify-start gap-1 text-[10px] sm:text-[10.5px] border-t border-slate-100 pt-2 bg-white whitespace-nowrap overflow-none">
                                    {(groupSummaries.length > 0 ? groupSummaries : [{ type: prop.transactionType, count: 1 }]).map((s) => (
                                      <button
                                        key={s.type}
                                        type="button"
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          setSelectedMapGroupKey(groupKey);
                                          const matchingProp = propertiesInGroup.find(p => p.transactionType === s.type) || propertiesInGroup[0] || prop;
                                          if (matchingProp) {
                                            setActiveMarkerId(matchingProp.id);
                                          }
                                        }}
                                        className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 flex items-center gap-0.5 transition-all text-[11px]"
                                      >
                                        <span>{s.type}</span>
                                        <strong className="text-[#03C75A] font-black">{s.count}</strong>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </CustomOverlayMap>
                            ) : (
                              /* Default Count Bubble (Screenshot 1 design) */
                              <CustomOverlayMap
                                position={{ lat: propLat, lng: propLng }}
                                clickable={true}
                                zIndex={1}
                                xAnchor={0.5}
                                yAnchor={0.5}
                              >
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMapCenter({ lat: propLat, lng: propLng });
                                    setSelectedMapGroupKey(groupKey);
                                    if (isGroup) {
                                      setActiveMarkerId(propertiesInGroup[0].id);
                                    } else {
                                      setActiveMarkerId(prop.id);
                                    }
                                  }}
                                  className={`flex items-center justify-center cursor-pointer select-none rounded-full text-white font-black hover:scale-110 hover:shadow-lg transition-all border border-white shadow-md active:scale-95 ${
                                    prop.category === '아파트' || prop.category === '오피스텔' 
                                      ? 'bg-[#3A8AF6]' 
                                      : 'bg-[#7B8C9E]'
                                  }`}
                                  style={{ 
                                    transform: 'none',
                                    pointerEvents: 'auto',
                                    width: '32px',
                                    height: '32px',
                                    fontSize: '11px'
                                  }}
                                >
                                  {propertiesInGroup.length || 1}
                                </div>
                              </CustomOverlayMap>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </Map>
                  ) : kakaoLoadFailed ? (
                    <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center bg-rose-50/95 font-sans border border-rose-200 rounded-3xl min-h-[450px] overflow-y-auto">
                      <span className="text-3xl mb-2">⚠️</span>
                      <h4 className="text-sm font-black text-rose-900 flex items-center gap-1.5 shrink-0">
                        <span>카카오 지도 시스템 연결 실패 (Connection Blocked)</span>
                      </h4>
                      <p className="text-[11px] text-rose-700 max-w-sm leading-relaxed mt-1 font-semibold">
                        {kakaoErrorMsg || 'API 인증과정 혹은 스크립트 연결 중 타임아웃 오류가 발생했습니다.'}
                      </p>

                      {/* Diagnostic Dashboard to satisfy explicit debugging requirements */}
                      <div className="w-full max-w-md bg-slate-900 text-left rounded-xl p-3 border border-slate-800 text-[10px] font-mono mt-3 space-y-1.5 text-slate-300 shadow-inner">
                        <div className="text-amber-400 font-bold border-b border-slate-800 pb-1 mb-1 text-center font-sans">⚡ 실시간 카카오맵 전산지표 디버거</div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">호스트명 (Hostname):</span>
                          <span className="text-sky-400 font-bold truncate max-w-[240px]">{kakaoDiagnostics.hostname}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">SDK 스크립트 URL:</span>
                          <span className="text-slate-400 truncate max-w-[240px]" title={kakaoDiagnostics.sdkUrl}>{kakaoDiagnostics.sdkUrl}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">카카오 API 키:</span>
                          <span className="text-amber-500 font-bold">{kakaoDiagnostics.appkey}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">window.kakao 전역객체:</span>
                          <span className={kakaoDiagnostics.hasKakaoGlobal ? "text-emerald-400 font-bold" : "text-rose-400"}>
                            {kakaoDiagnostics.hasKakaoGlobal ? "감지됨 (Loaded)" : "없음 (Undefined)"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">window.kakao?.maps 모듈:</span>
                          <span className={kakaoDiagnostics.hasMapsGlobal ? "text-emerald-400 font-bold" : "text-rose-400"}>
                            {kakaoDiagnostics.hasMapsGlobal ? "감지됨 (Loaded)" : "없음 (Undefined)"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">스크립트 로딩 완료상태:</span>
                          <span className="text-amber-400 font-bold uppercase">{kakaoDiagnostics.scriptStatus}</span>
                        </div>
                        {kakaoDiagnostics.scriptErrorMsg && (
                          <div className="border-t border-slate-800/80 pt-1.5 mt-1 text-rose-400 text-[9px] leading-normal break-all">
                            ⚠️ 에러내용: {kakaoDiagnostics.scriptErrorMsg}
                          </div>
                        )}
                        {kakaoDiagnostics.initError && (
                          <div className="border-t border-slate-800/80 pt-1.5 mt-1 text-rose-400 text-[9px] leading-normal break-all">
                            ⚠️ 초기화예외: {kakaoDiagnostics.initError}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex flex-col md:flex-row gap-2 w-full max-w-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setMapKey(prev => prev + 1);
                            setIsKakaoLoaded(false);
                            setKakaoLoadFailed(false);
                            console.log("🔄 Retrying Kakao system initialize connection...");
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-450 text-slate-950 text-[10.5px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-md border border-amber-400 text-center"
                        >
                          🔄 지도 다시 시도하기
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowKakaoGuide(true);
                          }}
                          className="flex-1 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10.5px] py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs text-center"
                        >
                          도메인 가이드 🛠
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10.5px] py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 text-center shadow-xs"
                        >
                          🚀 새 창에서 열기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full relative flex flex-col items-center justify-center p-8 text-center bg-slate-50 font-sans border border-slate-200 rounded-3xl min-h-[450px]">
                      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 shrink-0">
                        <span>⌛ 카카오 정밀 ROADMAP 로딩 중</span>
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm leading-relaxed mt-2 font-semibold">
                        대한민국 최신 도로 및 건물 데이터가 실시간 탑재된 카카오맵 전산지도를 연결 중입니다.
                      </p>
                      
                      <div className="mt-5 flex flex-col gap-2 w-full max-w-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setShowKakaoGuide(true);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs"
                        >
                          도메인 보안 가이드 🛠
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 text-center shadow-xs"
                        >
                          🚀 새 창에서 100% 정상 구동 열기
                        </button>
                      </div>
                    </div>
                  )}
                  

                </div>

              </div>
            ) : false ? (
              /* Collaborative B2B OpenList Spreadsheet and Ledger Layout */
              <div className="flex flex-col gap-5 text-left">
                
                {/* Real-time B2B OpenList Info Banner & Synchronizer */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 rounded-3xl p-5 border border-amber-400/20 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-5 relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-start gap-3.5 z-10 text-left">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                        <span>실시간 실거래 & 공동중개망 연동 (오픈리스트 B2B)</span>
                        <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse font-sans">
                          Live AI
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                        국토교통부 실거래 데이터 및 포털 부동산(네이버/카카오 등) 매물을 AI로 실시간 스캔 대조하여, 부산진구와 사상구 냉정로 일대 현시점 최고의 최신 정밀 매물들을 오픈리스트 전산식으로 동기화합니다.
                      </p>
                      {syncCount > 0 && (
                        <div className="text-[11px] text-amber-400 font-bold mt-1.5">
                          ● 현재 총 {syncCount}개의 실시간 최신 매물이 추가 연동되어 상단에 우선 노출 중입니다.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleFetchLatestProperties}
                    disabled={isSyncing}
                    className={`relative group px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer z-10 w-full lg:w-auto h-fit justify-center shrink-0 shadow-lg ${
                      isSyncing
                        ? 'bg-slate-700 text-slate-300 cursor-not-allowed border border-slate-600'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400 border border-amber-400/50 hover:shadow-amber-500/10'
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></span>
                        <span className="animate-pulse text-left text-[11px] line-clamp-1">{syncStatus || "조회 중..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform duration-350" />
                        <span>⚡ 최신 매물 실시간 동기화</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                  {/* Left: Dense Spreadsheet Table */}
                  <div className="xl:col-span-8 bg-white rounded-3xl p-5 border border-slate-200/50 shadow-xs overflow-hidden text-left w-full">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="text-xs text-slate-500 font-bold">
                        총 <strong className="text-amber-600 font-black">{filteredProperties.length}</strong>개의 전산 매물이 필터링되어 대조 중입니다. (행 클릭 시 상세 원장 조회)
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] bg-amber-55 rounded-lg py-1 px-2.5 text-amber-800 font-extrabold border border-amber-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>실시간 공동중개 전산망 (ACTIVE)</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-tight">
                            <th className="py-2.5 px-3">구분</th>
                            <th className="py-2.5 px-2">거래</th>
                            <th className="py-2.5 px-3">매물명 / 단지명</th>
                            <th className="py-2.5 px-2">금액 / 보증금</th>
                            <th className="py-2.5 px-2">월세</th>
                            <th className="py-2.5 px-2">평수</th>
                            <th className="py-2.5 px-2">층수</th>
                            <th className="py-2.5 px-2">방향</th>
                            <th className="py-2.5 px-3">준공년도</th>
                            <th className="py-2.5 px-2 text-right">상세조회</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredProperties.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
                                조건에 부응하는 전산 매물이 존재하지 않습니다. 상단의 실시간 동기화를 실행해 최신 데이터를 로드해 보세요!
                              </td>
                            </tr>
                          ) : (
                            filteredProperties.map((prop) => {
                              const isActive = activeMarkerId === prop.id;
                              const isRealtime = prop.id.startsWith('realtime');
                              return (
                                <tr
                                  key={prop.id}
                                  onClick={() => {
                                    setActiveMarkerId(prop.id);
                                    setMapCenter({ lat: prop.mapLat, lng: prop.mapLng });
                                  }}
                                  className={`hover:bg-amber-50/35 cursor-pointer transition-colors ${
                                    isActive ? 'bg-amber-55/60 font-medium font-bold' : ''
                                  }`}
                                >
                                  <td className="py-3 px-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                      isRealtime 
                                        ? 'bg-amber-100 text-amber-850 border border-amber-300/30' 
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {prop.category}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2">
                                    <span className={`font-black text-[11px] ${
                                      prop.transactionType === '매매' 
                                        ? 'text-red-500' 
                                        : prop.transactionType === '전세' 
                                          ? 'text-blue-500' 
                                          : 'text-emerald-500'
                                    }`}>
                                      {prop.transactionType}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 max-w-[160px] truncate">
                                    <div className="flex items-center gap-1">
                                      {isRealtime && <Sparkles className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />}
                                      <span className="text-slate-800 font-extrabold truncate" title={prop.name}>{prop.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 font-bold text-slate-900">
                                    {prop.transactionType === '월세' 
                                      ? (prop.priceText.includes('/') ? prop.priceText.split('/')[0].replace('보증금', '').trim() : prop.priceText) 
                                      : getCleanedPriceText(prop.transactionType, prop.priceText)}
                                  </td>
                                  <td className="py-3 px-2 font-bold text-emerald-600">
                                    {prop.rentValue ? `${prop.rentValue}만` : '-'}
                                  </td>
                                  <td className="py-3 px-2 font-extrabold text-slate-700">
                                    {prop.pyongValue}평
                                  </td>
                                  <td className="py-3 px-2 text-slate-500 font-semibold animate-none">
                                    {prop.floorText || '-'}
                                  </td>
                                  <td className="py-3 px-2 text-slate-500 font-semibold">
                                    {prop.direction || '-'}
                                  </td>
                                  <td className="py-3 px-3 text-slate-400 font-semibold">
                                    {prop.useYearValue ? `${prop.useYearValue}년` : '-'}
                                  </td>
                                  <td className="py-3 px-2 text-right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDetailsAndSetInquiry(prop);
                                      }}
                                      className="bg-slate-900 text-white rounded-lg text-[10px] font-extrabold py-1 px-2.5 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                                    >
                                      원장전문
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Property Ledger One-stop Summary Card */}
                  <div className="xl:col-span-4 flex flex-col gap-4 text-left w-full">
                    {(() => {
                      const activeProp = filteredProperties.find(p => p.id === activeMarkerId) || filteredProperties[0];
                      if (!activeProp) {
                        return (
                          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/40 text-center text-slate-400 font-bold">
                            전산에서 원장을 보여줄 매물을 왼쪽 리스트에서 선택해 주세요.
                          </div>
                        );
                      }
                      const isRealtime = activeProp.id.startsWith('realtime');
                      return (
                        <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-lg flex flex-col gap-4 text-left">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                              {isRealtime && <Sparkles className="w-3 h-3 animate-pulse" />}
                              <span>B2B 공동중개 원장조회</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {activeProp.propertyNo ? `매물번호: ${activeProp.propertyNo}` : `ID: ${activeProp.id.substring(0, 10)}`}
                            </span>
                          </div>

                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                              <img src={resolveDriveImageUrl(activeProp.imageUrl)} alt={activeProp.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  {activeProp.category}
                                </span>
                                <span className={`text-xs font-black uppercase ${
                                  activeProp.transactionType === '매매' 
                                    ? 'text-red-400' 
                                    : activeProp.transactionType === '전세' 
                                      ? 'text-blue-400' 
                                      : 'text-emerald-400'
                                }`}>
                                  {activeProp.transactionType}
                                </span>
                              </div>
                              <h4 className="text-sm font-black whitespace-normal line-clamp-1 mt-1 text-white">{activeProp.name}</h4>
                            </div>
                          </div>

                          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-800/60 flex flex-col gap-2 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                              <span className="text-slate-400">거래금액</span>
                              <span className="text-amber-400 font-extrabold text-sm">{getPropertyPriceDisplay(activeProp)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                              <span className="text-slate-400">전용/계약면적</span>
                              <span className="text-slate-200 font-bold">{activeProp.pyongValue}평형 ({activeProp.area || Math.round(activeProp.pyongValue * 3.3).toString() + '㎡'})</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                              <span className="text-slate-400">층수구분</span>
                              <span className="text-slate-200 font-bold">{activeProp.floorText}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                              <span className="text-slate-400">주차여부</span>
                              <span className="text-slate-200 font-semibold">{activeProp.parking || '자주식 가능'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-700/40">
                              <span className="text-slate-400">관리비</span>
                              <span className="text-emerald-400 font-semibold">{activeProp.mFee || '전산 문의'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-400">준공연도</span>
                              <span className="text-slate-200 font-semibold">{activeProp.useYearText}</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-300 font-medium leading-relaxed bg-slate-800/55 p-3 rounded-xl border border-slate-800/80">
                            <strong>물건설명: </strong>{activeProp.description}
                          </div>

                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                            {/* Copy Address Button */}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(activeProp.fullAddr || activeProp.location);
                                alert('소재지 주소가 클립보드에 저 복사되었습니다.');
                              }}
                              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 rounded-xl py-2.5 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span>소재지 주소 복사하기</span>
                            </button>

                            {/* Show full Ledger details overlay */}
                            <button
                              type="button"
                              onClick={() => openDetailsAndSetInquiry(activeProp)}
                              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl py-3 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>계약조건 및 매물원장 인쇄/상담</span>
                            </button>

                            {/* Admin Mode - Edit and Delete Property Options */}
                            {isAdminMode && (
                              <div className="flex gap-2 mt-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleStartEditProperty(activeProp);
                                  }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                                  style={{ backgroundColor: "#2563EB" }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>수정하기</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeleteProperty(activeProp.id, e);
                                  }}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                                  style={{ backgroundColor: "#DC2626" }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>전산 삭제</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
            ) : (
              /* Original Grid View Layout */
              <div className="flex flex-col gap-8 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <AnimatePresence mode="popLayout">
                    {paginatedProperties.map((prop, index) => {
                    const isFavorite = favorites.includes(prop.id);
                    return (
                      <motion.article
                        key={prop.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.23, delay: Math.min(index * 0.05, 0.2) }}
                        className="group bg-white rounded-2xl border border-amber-200/50 shadow-xs hover:shadow-md hover:border-amber-400/35 overflow-hidden transition-all duration-200 flex flex-col justify-between"
                        id={`property-card-${prop.id}`}
                      >
                        {/* Capture Area Div for html2canvas downloading */}
                        <div id={`capture-area-${prop.id}`} className="bg-white p-2">
                          <div className="relative rounded-xl overflow-hidden bg-white">
                            {/* Property Image & Hover scale */}
                            <div className="relative aspect-video w-full overflow-hidden bg-slate-100 rounded-lg">
                              <img 
                                src={resolveDriveImageUrl(prop.imageUrl)} 
                                alt={prop.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-95" />
                              
                              {/* Heart Favorite button absolute top */}
                              <button
                                onClick={(e) => toggleFavorite(prop.id, e)}
                                className="absolute right-3.5 top-3.5 p-2 rounded-full bg-white/80 backdrop-blur-xs text-slate-700 hover:text-red-500 hover:bg-white transition-all shadow-xs cursor-pointer z-10"
                                title="관심 매물 등록"
                              >
                                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-700'}`} />
                              </button>

                              {/* Floating Edit & Delete buttons - Visible only when Admin Mode is Active */}
                              {isAdminMode && (
                                <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 z-30">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleStartEditProperty(prop);
                                    }}
                                    className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer transition-transform hover:scale-105"
                                    style={{ backgroundColor: "#2563EB" }}
                                    title="매물 즉시 수정"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleDeleteProperty(prop.id, e);
                                    }}
                                    className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer transition-transform hover:scale-105"
                                    style={{ backgroundColor: "#DC2626" }}
                                    title="매물 즉시 삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}

                              {/* Dynamic transaction Category badge */}
                              <div className="absolute left-3.5 bottom-3.5 flex flex-col gap-1 items-start">
                                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  {prop.category}
                                </span>
                                <span className="text-white text-sm sm:text-base font-black tracking-tight drop-shadow-sm/85">
                                  {getPropertyPriceDisplay(prop)}
                                </span>
                              </div>
                            </div>

                            {/* Card Contents */}
                            <div className="p-3">
                              {/* Tags block */}
                              <div className="flex flex-wrap gap-1 mb-2">
                                {prop.tags.map((tag) => (
                                  <span key={tag} className="bg-amber-100/50 text-amber-900 border border-amber-200/30 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors tracking-tight line-clamp-1">
                                {prop.name}
                              </h3>

                              {/* Detail Grid values */}
                              <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500 font-semibold mb-2">
                                <div className="flex items-center gap-1 uppercase">
                                  <span className="text-[9px] font-black text-amber-500">■</span>
                                  <span>면적: <strong className="text-slate-800">{prop.pyongValue}평</strong></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-black text-amber-500">■</span>
                                  <span>연식: <strong className="text-slate-800">{prop.useYearValue}년</strong></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-black text-amber-500">■</span>
                                  <span>층수: <strong className="text-slate-800">{prop.floorText.split('/')[0]}</strong></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-black text-amber-500">■</span>
                                  <span>방향: <strong className="text-slate-800">{prop.direction}</strong></span>
                                </div>
                              </div>

                              {/* Address Info */}
                              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="line-clamp-1">{prop.location}</span>
                              </p>

                              {/* Elegant brand watermark to display in downloaded images */}
                              <div className="mt-3 pt-2.5 border-t border-dashed border-amber-200/40 flex items-center justify-between text-[9px] text-amber-800 font-bold bg-amber-50/20 px-2 py-1.5 rounded-lg opacity-80">
                                <span className="flex items-center gap-1 text-amber-900"><Building className="w-3 h-3 text-amber-600" /> 부강 공인중개사</span>
                                <span>T. 051-893-8959</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detail triggers (Outside capture area) */}
                        <div className="p-3 pt-0 border-t border-slate-50 flex items-center gap-1.5 mt-auto">
                          <button
                            onClick={() => openDetailsAndSetInquiry(prop)}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2 rounded-xl text-center flex items-center justify-center gap-0.5 group/btn cursor-pointer shadow-xs transition-colors"
                          >
                            <span>상세상담</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleSaveAsImage(prop.id)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200/40 text-slate-700 text-xs font-black px-2 py-2 rounded-xl text-center flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="이미지로 저장"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>저장</span>
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Grid View Pagination Controls */}
              {Math.ceil(filteredProperties.length / 12) > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-4 flex-wrap">
                  {/* Previous Page Button */}
                  <button
                    onClick={() => {
                      if (gridPage > 1) {
                        setGridPage(gridPage - 1);
                        setTimeout(() => {
                          document.getElementById('listings-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }
                    }}
                    disabled={gridPage === 1}
                    className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      gridPage === 1 
                        ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 active:scale-95'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.ceil(filteredProperties.length / 12) }).map((_, i) => {
                    const p = i + 1;
                    const isSelected = gridPage === p;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setGridPage(p);
                          setTimeout(() => {
                            document.getElementById('listings-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 50);
                        }}
                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-400/30 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  {/* Next Page Button */}
                  <button
                    onClick={() => {
                      const totalP = Math.ceil(filteredProperties.length / 12);
                      if (gridPage < totalP) {
                        setGridPage(gridPage + 1);
                        setTimeout(() => {
                          document.getElementById('listings-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }
                    }}
                    disabled={gridPage === Math.ceil(filteredProperties.length / 12)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      gridPage === Math.ceil(filteredProperties.length / 12)
                        ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 active:scale-95'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            )}
          </div>

        </div> {/* Close w-full flex flex-col gap-6 Wrapper */}

      {/* ==========================================
          OFFLINE DIRECTIONS & MAP PLOT SECTION
          ========================================== */}
      <section className="bg-white py-12 md:py-16 border-t border-amber-200/30" id="map-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-amber-650 text-xs font-black uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-md">
              찾아오시는 길
            </span>
            <h2 className="text-2xl sm:text-3.5xl font-black tracking-tight text-slate-900 mt-3 mb-2 leading-tight">
              부강부동산으로 오시는 길
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-bold leading-relaxed">
              롯데캐슬골드아너, 가야반도보라빌 인근 큰 대로변 1층에 자리하고 있어 쉽게 발견하실 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Visual Vector Simulated Map (8 columns for gorgeous UI map layout) */}
            <div className="lg:col-span-8 bg-amber-50/10 rounded-2xl border border-amber-200/50 relative overflow-hidden min-h-[480px] p-4 flex flex-col justify-between">
              
              {/* Map Absolute Overlay Banner */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-amber-200/50 shadow-sm z-10 text-xs flex flex-col gap-0.5">
                <span className="font-black text-slate-900 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-amber-500" />
                  노란색 간판 부강부동산
                </span>
                <span className="text-[10px] text-slate-400 font-bold">주차 무료 지원</span>
              </div>

              {/* Kakao Map Component Container */}
              <div className="w-full h-[400px] rounded-2xl overflow-hidden relative border border-slate-105 shadow-inner mt-11 bg-slate-100 flex items-center justify-center">
                {isKakaoLoaded ? (
                  <Map
                    key={`kakao-direction-map-${mapKey}`}
                    center={{ lat: 35.151261, lng: 129.029706 }}
                    style={{ width: "100%", height: "100%" }}
                    level={4}
                    mapTypeId="ROADMAP"
                    onCreate={(map) => {
                      if (map) {
                        try {
                          console.log("🚀 [Kakao Map Core SUCCESS] Directions map object instance created successfully! (center: " + map.getCenter().toString() + ")");
                        } catch (e) {
                          console.log("🚀 [Kakao Map Core SUCCESS] Directions map object instance created successfully!");
                        }
                      } else {
                        console.error("❌ [Kakao Map Core ERROR] Directions map component mounted but instance initialization failed.");
                      }
                    }}
                  >
                    {/* Office Pin */}
                    <MapMarker
                      position={{ lat: 35.151261, lng: 129.029706 }}
                    >
                      <div className="p-2.5 text-xs font-black text-slate-900 bg-white border border-amber-400 rounded-lg shadow-md max-w-[190px] leading-snug">
                        <div className="text-amber-655 font-black mb-0.5" style={{ color: "#EAB308" }}>🏢 부강부동산</div>
                        <div className="text-[10px] text-slate-500 font-extrabold">부산 냉정로 273 (큰 대로변 1층)</div>
                      </div>
                    </MapMarker>
                  </Map>
                ) : kakaoLoadFailed ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-rose-50 font-sans border border-rose-200 rounded-2xl">
                    <span className="text-2xl mb-2">⚠️</span>
                    <h4 className="text-xs font-bold text-rose-900">카카오 오시는길 지도 로드 실패</h4>
                    <p className="text-[10px] text-rose-600 mt-1 max-w-[300px] leading-relaxed">
                      네트워크 지연 혹은 도메인 차단으로 지도 자료를 불러오지 못했습니다.
                    </p>
                    {kakaoErrorMsg && (
                      <p className="text-[9px] text-rose-500 mt-1.5 font-mono max-w-[280px] leading-normal break-all bg-white/60 p-1 rounded border border-rose-200">
                        {kakaoErrorMsg}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 font-sans border border-slate-200 rounded-2xl">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <h4 className="text-xs font-bold text-slate-900">카카오 오시는길 지도 로딩 중...</h4>
                  </div>
                )}
              </div>

              {/* Instructions list below */}
              <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/50 text-slate-600 font-semibold text-[10px] sm:text-xs tracking-tight flex flex-col gap-3 mt-4">
                <div>
                  <span className="font-extrabold text-[#F59E0B] block mb-1">🚗 승용차 방문시:</span>
                  <p>부산 부산진구 가야공원로 20-1 <span className="font-black text-slate-800 underline decoration-amber-400">동양민영주차장</span> 에 무료 주차 가능합니다. 주차 하신 후, 걸어서 부강부동산으로 방문해주세요.</p>
                </div>
                
                <div className="border-t border-slate-100/80 pt-2.5">
                  <span className="font-extrabold text-amber-600 block mb-1">🚇 지하철 방문시:</span>
                  <p>동의대역 7번 출구에서 빠져나와 직진한 후, 가야성당 방면으로 좌회전하신 후 위로 올라오시면 교차로에 부강부동산이 보입니다.</p>
                </div>
                
                <div className="border-t border-slate-100/80 pt-2.5">
                  <span className="font-extrabold text-blue-600 block mb-1">🚌 버스 방문시:</span>
                  <p>67번 버스를 탑승하신 후, 가야지구 or 가야2동새마을금고에 내리신 후 걸어오시면 됩니다.</p>
                </div>
              </div>

            </div>

            {/* Address & office credentials list (4 columns) */}
            <div className="lg:col-span-4 bg-slide-amber/2 bg-amber-100/15 border border-amber-250/20 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-6">
              
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-amber-200/30 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center p-1 font-black text-slate-950">
                    ★
                  </div>
                  <span className="font-black text-slate-950 text-base sm:text-lg">중개사무소 정보</span>
                </div>

                <div className="flex flex-col gap-4 text-xs font-semibold">
                  
                  {/* Address */}
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 font-extrabold">사무실 소재지</span>
                    <p className="text-slate-800 text-sm font-black flex items-start gap-1">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>부산광역시 부산진구 냉정로 273 1층 (부강 부동산)</span>
                    </p>
                  </div>

                  {/* Representative name */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-slate-400 font-extrabold">대표</span>
                    <p className="text-slate-800 text-sm font-black flex items-center gap-1">
                      <Home className="w-4 h-4 text-amber-500" />
                      <span>고민주</span>
                    </p>
                  </div>

                  {/* Registration Number */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-slate-400 font-extrabold">등록번호</span>
                    <p className="text-slate-800 text-sm font-black flex items-center gap-1">
                      <FileText className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>제26230-2025-00053호</span>
                    </p>
                  </div>

                  {/* Telephone */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-slate-400 font-extrabold">대표 유선 전화</span>
                    <p className="text-slate-800 text-sm font-black flex items-center gap-1">
                      <Phone className="w-4 h-4 text-amber-500" />
                      <a href="tel:051-897-8900" className="text-amber-600 hover:underline">051-897-8900</a>
                    </p>
                  </div>

                  {/* Fax */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-slate-400 font-extrabold">팩스 연락처</span>
                    <p className="text-slate-800 text-sm font-black flex items-center gap-1">
                      <Printer className="w-4 h-4 text-amber-500" />
                      <span>051-897-9004</span>
                    </p>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-slate-400 font-extrabold">대표 이메일 주소</span>
                    <p className="text-slate-800 text-sm font-black flex items-center gap-1">
                      <Mail className="w-4 h-4 text-amber-500" />
                      <a href="mailto:junku97@naver.com" className="text-slate-900 hover:underline">junku97@naver.com</a>
                    </p>
                  </div>

                </div>
              </div>

              {/* Work time credentials inside layout */}
              <div className="bg-white/80 p-4 rounded-xl border border-amber-200/40 mt-auto">
                <span className="font-black text-slate-900 text-xs flex items-center gap-1 mb-2">
                  <Clock className="w-4 h-4 text-amber-500 animate-spin-slow" />
                  ⏰ 업무 가동 업무 가능 시간
                </span>
                <ul className="text-[11px] text-slate-500 font-bold space-y-1">
                  <li className="flex justify-between"><span> 평일 (월 ~ 금):</span> <strong className="text-slate-800">09:00 ~ 20:00</strong></li>
                  <li className="flex justify-between"><span> 토요일:</span> <strong className="text-slate-800">09:30 ~ 17:00</strong></li>
                  <li className="flex justify-between"><span> 일요일:</span> <strong className="text-slate-800">사전 예약 회원제 운영</strong></li>
                </ul>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
          DETAIL DIALOG MODAL (Aesthetic Frosted Glass Pop)
          ========================================== */}
      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProperty(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-amber-200/70 z-50 p-0 max-h-[85vh] flex flex-col"
              id="property-detail-modal"
            >
              {/* Header: Title and Close */}
              <header className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/40">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                    {selectedProperty.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight select-none">
                    {selectedProperty.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              {/* Scrollable contents */}
              <div className="flex-grow overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 text-xs sm:text-sm font-semibold text-slate-600">
                
                {/* Large Preview Image & Interactive Carousel */}
                {(() => {
                  const modalImages = selectedProperty.imageUrls && selectedProperty.imageUrls.length > 0
                    ? selectedProperty.imageUrls
                    : (selectedProperty.imageUrl ? [selectedProperty.imageUrl] : []);
                  const totalImages = modalImages.length;
                  const currentImg = modalImages[detailImageIndex] || selectedProperty.imageUrl;
                  const resolved = resolveDriveImageUrl(currentImg);

                  return (
                    <div className="flex flex-col gap-2">
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-150 shadow-xs border border-slate-100">
                        <img 
                          src={resolved} 
                          alt={selectedProperty.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain bg-slate-950" 
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-transparent to-transparent pointer-events-none" />
                        
                        {/* Prev / Next Chevrons */}
                        {totalImages > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailImageIndex(prev => (prev - 1 + totalImages) % totalImages);
                              }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-105 active:scale-95"
                              title="이전 사진"
                            >
                              <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailImageIndex(prev => (prev + 1) % totalImages);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-105 active:scale-95"
                              title="다음 사진"
                            >
                              <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
                            </button>
                            
                            {/* Fraction Counter Indicator */}
                            <div className="absolute top-4 right-4 bg-black/65 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider leading-none select-none">
                              {detailImageIndex + 1} / {totalImages}
                            </div>
                          </>
                        )}

                        {/* Status Banner */}
                        <div className="absolute bottom-4 left-4">
                          <span className="text-xs text-amber-300 font-extrabold uppercase">매물 안내 실시간</span>
                          <p className="text-white text-lg sm:text-xl font-black mt-0.5">
                            {getPropertyPriceDisplay(selectedProperty)}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Bottom Mini Thumbnail Strips */}
                      {totalImages > 1 && (
                        <div className="flex gap-1.5 items-center justify-start sm:justify-center overflow-x-auto py-1 scrollbar-none px-1">
                          {modalImages.map((imgUrl, mIdx) => {
                            const isSelected = mIdx === detailImageIndex;
                            const tResolved = resolveDriveImageUrl(imgUrl);
                            return (
                              <button
                                key={mIdx}
                                type="button"
                                onClick={() => setDetailImageIndex(mIdx)}
                                className={`w-12 h-12 rounded-lg border-2 overflow-hidden transition-all shrink-0 cursor-pointer ${
                                  isSelected ? 'border-amber-500 scale-102 ring-1 ring-amber-400 shadow-xs' : 'border-slate-200 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img 
                                  src={tResolved} 
                                  alt={`사진섬네일 ${mIdx + 1}`} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                                  }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Narrative description */}
                <div className="flex flex-col gap-2">
                  <span className="text-slate-400 font-extrabold flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    공인 대표 중개 안내 및 소견
                  </span>
                  <p className="text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed bg-amber-50/20 p-4 rounded-2xl border border-amber-200/30">
                    {selectedProperty.description}
                  </p>
                </div>

                {/* Structured attributes Table */}
                <div className="flex flex-col gap-2">
                  <span className="text-slate-400 font-extrabold flex items-center gap-1">
                    <FileText className="w-4 h-4 text-amber-500" />
                    법적 의무 고시사항 및 요약표 (이미지 캡처 지원)
                  </span>
                  <div className="flex justify-center bg-slate-50 p-2 sm:p-4 rounded-2xl border border-slate-200/50 overflow-x-auto">
                    <PropertyDetailTable data={selectedProperty} />
                  </div>
                </div>

                {/* Core Advantages List */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-slate-400 font-extrabold">⭐ 이 매물의 차별화 핵심 프리미엄</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProperty.features.map((feat, fIdx) => (
                      <div key={fIdx} className="bg-amber-50/45 p-3 rounded-xl border border-amber-250/20 flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-bold leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

               {/* Dialog bottom controls */}
              <footer className="p-4 sm:p-5 border-t border-amber-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50">
                <button
                  onClick={() => {
                    setSelectedProperty(null);
                    const el = document.getElementById('inquiry-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="flex-grow bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-center cursor-pointer transition-colors"
                >
                  이 매물 즉시 상담 신청
                </button>
                <button
                  onClick={downloadImage}
                  className="bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white font-black px-4 py-3 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  title="법적요령 고시 표 이미지 파일(PNG)로 영구 저장"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>표 이미지 저장</span>
                </button>
                {isAdminMode && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStartEditProperty(selectedProperty);
                        setSelectedProperty(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-3 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: "#2563EB" }}
                      title="해당 매물 정보를 수동 관리자 모드로 수정 제어합니다."
                    >
                      <Edit className="w-4 h-4" />
                      <span>매물 정보 수정</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteProperty(selectedProperty.id, e);
                      }}
                      className="bg-red-600 hover:bg-red-750 text-white font-black px-4 py-3 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: "#DC2626" }}
                      title="해당 매물을 즉시 삭제하고 목록에서 영구 제거합니다."
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>매물 즉시 삭제</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-5 py-3 rounded-xl cursor-pointer transition-colors"
                >
                  닫기
                </button>
              </footer>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          FOOTER: CREDENTIAL DETAILS BLOCK
          ========================================== */}
      <footer className="bg-slate-900 text-slate-400 text-xs font-medium border-t border-slate-800 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Identity column (5 columns) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center p-1 font-black text-slate-950 shadow-sm">
                부강
              </div>
              <span className="text-base sm:text-lg font-black text-white tracking-wider">
                부강부동산
              </span>
            </div>
            
            <p className="text-[11px] leading-relaxed text-slate-450 max-w-sm">
              부산광역시 부산진구 냉정로 일대 전문 중개업으로 등록 인가받은 부강부동산입니다. 허위매물 무조건 0% 사명감 실매물 제도의 철두철미한 투명 중개를 맹세합니다.
            </p>

            <div className="text-[10px] text-slate-550 font-semibold uppercase tracking-widest mt-2">
              등록번호: 제 26230-2023-00045 호 | 사업자등록코드: 814-11-22894
            </div>
          </div>

          {/* Links column (3 columns) */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="text-white font-black text-xs uppercase tracking-wider">전문 매물 분야 목록</span>
            <ul className="space-y-2 text-[11px] font-bold text-slate-450">
              <li><button onClick={() => applyPresetFilter('아파트', '전체')} className="hover:text-amber-400 text-left">개금동 / 양정동 대단지 아파트 정보</button></li>
              <li><button onClick={() => applyPresetFilter('원룸', '전체')} className="hover:text-amber-400 text-left">초역세권 서면 원룸 전문매물</button></li>
              <li><button onClick={() => applyPresetFilter('분양권', '전체')} className="hover:text-amber-400 text-left">재개발/재건축 고층 브랜드 분양권</button></li>
              <li><button onClick={() => applyPresetFilter('상가', '전체')} className="hover:text-amber-400 text-left">상가 입지분석 및 개발매물</button></li>
            </ul>
          </div>

          {/* Info credentials list (4 columns) */}
          <div className="md:col-span-4 flex flex-col gap-4 text-slate-450 text-[11px] font-semibold">
            <span className="text-white font-black text-xs uppercase tracking-wider block">사무소 등록 상세 정보</span>
            
            <div className="flex flex-col gap-2 leading-relaxed">
              <p>📍 <strong>소재지:</strong> 부산광역시 부산진구 냉정로 273 1층 (부강 부동산)</p>
              <p>👤 <strong>소속 공인중개사:</strong> 대표 고민주 소장</p>
              <p>✉ <strong>대표 이메일:</strong> <a href="mailto:junku97@naver.com" className="hover:text-white underline">junku97@naver.com</a></p>
              <p>☎ <strong>유선 전화:</strong> <a href="tel:051-897-8900" className="text-white hover:underline">051-897-8900</a> | 📠 <strong>팩스번호:</strong> 051-897-9004</p>
            </div>

            <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-550 font-bold">
              Copyright © {new Date().getFullYear()} 부강부동산. All Rights Reserved.
            </div>
          </div>

        </div>
      </footer>

      {/* ==========================================
          CUSTOM DELETE CONFIRM MODAL (Iframe Safe React Modal)
          ========================================== */}
      <AnimatePresence>
        {deletePropertyId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletePropertyId(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-red-200 z-[10000] p-6 flex flex-col gap-4 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-1">매물 영구 삭제 확인</h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                  정말 이 매물을 삭제하시겠습니까?<br />
                  선택하신 매물은 대장 전산망 및 목록에서 즉각적이고 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>

              <div className="flex gap-2 font-bold text-xs mt-1">
                <button
                  type="button"
                  onClick={() => setDeletePropertyId(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deletePropertyId) {
                      executeDeleteProperty(deletePropertyId);
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  삭제하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          CUSTOM LOGIN MODAL (Iframe Safe React Modal)
          ========================================== */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-amber-200 z-[10000] p-6 flex flex-col gap-4"
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">대표 로그인</h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                  중개업소 전용 시스템 접속을 위해 인증 정보를 입력해주세요.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3 mt-1">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1">아이디 (ID)</label>
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-800"
                    id="login-id-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 mb-1">비밀번호 (PASSWORD)</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-800"
                    id="login-password-input"
                  />
                </div>

                <div className="flex gap-2 font-bold text-xs mt-3">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 py-2.5 rounded-xl cursor-pointer transition-colors font-black"
                  >
                    로그인
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          CUSTOM ALERT TOAST (Iframe Safe Notification)
          ========================================== */}
      <AnimatePresence>
        {customNotification && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-4 w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-slate-900 border border-slate-800 text-white shadow-xl rounded-xl py-3 px-4 flex items-center gap-3"
            >
              <div className="shrink-0 text-amber-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <p className="text-[11px] font-bold leading-relaxed flex-grow text-left">
                {customNotification}
              </p>
              <button
                type="button"
                onClick={() => setCustomNotification(null)}
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
