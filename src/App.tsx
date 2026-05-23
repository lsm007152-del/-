import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Home, 
  ChevronRight, 
  X, 
  TrendingUp, 
  Check, 
  Heart,
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
  Map as MapIcon,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import html2canvas from 'html2canvas';

// ==========================================
// TYPES & INTERFACES DEFINITIONS
// ==========================================

export type TransactionType = '전체' | '매매' | '전세' | '월세';
export type FilterCategory = '아파트' | '오피스텔' | '분양권' | '원룸' | '투룸' | '주택' | '빌라' | '상가' | '공장' | '토지';
export type ActiveTabType = '매물검색' | '아파트' | '오피스텔' | '분양권' | '원룸' | '투룸' | '주택' | '빌라' | '상가' | '공장' | '토지' | '오시는길' | '매물접수';

export interface Property {
  id: string;
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
  
  imageUrl: string;
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
    location: '부산광역시 부산진구 개금동',
    useYearText: '2019년 준공 (신축급)',
    useYearValue: 2019,
    householdsCount: 1450,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    tags: ['역세권', '대단지', '올수리', '초품아'],
    description: '개금역 도보 5분 거리의 초역세권 대단지 아파트입니다. 남향 배치로 일조량이 뛰어납니다. 내부 인테리어 올수리되어 즉시 입주 가능한 최상급 매물입니다.',
    features: ['방 3개, 욕실 2개', '주차 1.3대 가능', '개금초등학교 도보 3분', '단지 내 커뮤니티 센터 우수'],
    mapLat: 35.1535,
    mapLng: 129.0185
  },
  {
    id: 'prop-2',
    name: '서면 삼정그린코아 더시티',
    category: '오피스텔',
    transactionType: '월세',
    priceText: '보증금 1,000 / 월 65만',
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
    priceText: '보증금 3,000 / 월 150만',
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
      🏠 부강공인중개사사무소 ・ 매물번호: {data.id}
    </div>
    <table className="w-full text-xs border-collapse border border-amber-200">
      <tbody>
        {[
          { label: '1. 소재지', val: data.fullAddr || data.location },
          { label: '2. 면적', val: data.area || `${data.pyongValue}평 (전용 약 ${Math.floor(data.pyongValue * 3.3)}㎡)` },
          { label: '3. 가격', val: data.priceHTML || `${data.transactionType} ${data.priceText}` },
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
export default function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Tab states
  const [activeTab, setActiveTab] = useState<ActiveTabType>('매물검색');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('아파트');

  // Filter conditions
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType>('전체');
  const [priceLimit, setPriceLimit] = useState<string>('전체');
  const [sizeRange, setSizeRange] = useState<string>('전체');
  const [useYear, setUseYear] = useState<string>('전체');
  const [householdCount, setHouseholdCount] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Naver Real Estate style Map Split View Mode States
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 35.1542, lng: 129.0195 });
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState<boolean>(false);
  const [showKakaoGuide, setShowKakaoGuide] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [forceShowMap, setForceShowMap] = useState<boolean>(false);
  
  // Interactive Dropdowns Controls
  const [activeDropdown, setActiveDropdown] = useState<'price' | 'size' | 'year' | 'households' | null>(null);
  const [advancedSearch, setAdvancedSearch] = useState<boolean>(false);
  
  // Detail Modal Controls
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Saved Favorites Persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('bugang_favorites');
    return saved ? JSON.parse(saved) : [];
  });

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
  const [activeSubPills, setActiveSubPills] = useState<string[]>(['아파트']);

  // --- Admin and manual property persistence ---
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  const [newProp, setNewProp] = useState({
    name: '',
    category: '아파트',
    transactionType: '매매',
    priceText: '',
    priceValue: '',
    rentValue: '',
    pyongValue: '',
    floorText: '',
    direction: '남향',
    location: '',
    useYearText: '',
    useYearValue: '',
    householdsCount: '',
    imageUrl: '',
    tags: '',
    description: '',
    note: '',
    fullAddr: '',
    area: '',
    floor: '',
    dir: '',
    avail: '',
    rooms: '',
    date: '',
    parking: '',
    mFee: '',
    priceHTML: '',
    type: '',
    trade: '',
    mapLat: '',
    mapLng: ''
  });

  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('bugang_properties');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing loaded properties:', e);
      }
    }
    return INITIAL_PROPERTIES;
  });

  // Save properties to localStorage when altered
  useEffect(() => {
    localStorage.setItem('bugang_properties', JSON.stringify(properties));
  }, [properties]);

  const handleDeleteProperty = (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정말 이 매물을 삭제하시겠습니까?')) {
      setProperties(prev => prev.filter(p => p.id !== propertyId));
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
            alert(`카카오지도 조회 성공! 위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)} 자동 반영되었습니다.`);
          } else {
            alert('카카오지도로 해당 주소의 정확한 좌표를 찾지 못했습니다. 주소를 더 명확히 입력해 보시거나, 직접 위도/경도를 기재해 주세요.');
          }
        });
      } catch (err) {
        console.error('Geocoder error:', err);
        fallbackGeocode(addressToSearch);
      }
    } else {
      fallbackGeocode(addressToSearch);
    }
  };

  const fallbackGeocode = (addressToSearch: string) => {
    // Generate realistic Busan Jin-gu coordinates for fallback simulation
    const hash = addressToSearch.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const lat = 35.1535 + (hash % 100) / 10000;
    const lng = 129.0185 + (hash % 100) / 10000;
    setNewProp(prev => ({
      ...prev,
      mapLat: lat.toFixed(6),
      mapLng: lng.toFixed(6)
    }));
    alert(`[안내] 주소 기반 위치 변환 완료 (위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)})`);
  };

  const handleRegisterProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.name.trim()) {
      alert('매물 명칭을 입력해주세요.');
      return;
    }

    const pyong = Number(newProp.pyongValue) || 24;
    const useYear = Number(newProp.useYearValue) || 2020;
    const generatedId = `custom-prop-${Date.now()}`;

    const created: Property = {
      id: generatedId,
      name: newProp.name,
      category: newProp.category as any,
      transactionType: newProp.transactionType as any,
      priceText: newProp.priceText || '가격 협의',
      priceValue: Number(newProp.priceValue) || 1000,
      rentValue: newProp.rentValue ? Number(newProp.rentValue) : undefined,
      pyongValue: pyong,
      floorText: newProp.floorText || '고층/20층',
      direction: newProp.direction || '남향',
      location: newProp.location || '부산광역시 부산진구',
      useYearText: newProp.useYearText || `${useYear}년 준공`,
      useYearValue: useYear,
      householdsCount: Number(newProp.householdsCount) || 0,
      imageUrl: newProp.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
      tags: newProp.tags ? newProp.tags.split(',').map(s => s.trim()).filter(Boolean) : ['우수매물', '즉시안내'],
      description: newProp.description || '부강부동산 엄선 추천 실매물입니다.',
      features: [
        '중개사 책임 실사 완료 특급 상태',
        '인근 대중교통 이용 최상 인프라 권역',
        '채광 우수 및 공실 협시 즉시 입주',
        '부강공인중개사 소장 전속 권장'
      ],
      mapLat: Number(newProp.mapLat) || (35.1535 + (Math.random() - 0.5) / 100),
      mapLng: Number(newProp.mapLng) || (129.0185 + (Math.random() - 0.5) / 100),

      // --- 법적 고시 항목 보강 ---
      fullAddr: newProp.fullAddr || newProp.location || '부산광역시 부산진구',
      area: newProp.area || `${pyong}평 (전용 약 ${Math.floor(pyong * 3.3)}㎡)`,
      floor: newProp.floor || newProp.floorText || '고층/20층',
      dir: newProp.dir || newProp.direction || '남향',
      avail: newProp.avail || '즉시 입주 및 협의가능',
      rooms: newProp.rooms || '방 3개 / 욕실 2개',
      date: newProp.date || newProp.useYearText || `${useYear}.01.01`,
      parking: newProp.parking || '세대당 1.2대 수준',
      mFee: newProp.mFee || '약 15만원',
      note: newProp.note || newProp.description || '부강 엄선 실내 추천매물',
      priceHTML: newProp.priceHTML || `${newProp.transactionType} ${newProp.priceText}`,
      type: newProp.type || newProp.category,
      trade: newProp.trade || newProp.transactionType
    };

    setProperties(prev => [created, ...prev]);
    setShowAddForm(false);
    
    // reset form
    setNewProp({
      name: '',
      category: '아파트',
      transactionType: '매매',
      priceText: '',
      priceValue: '',
      rentValue: '',
      pyongValue: '',
      floorText: '',
      direction: '남향',
      location: '',
      useYearText: '',
      useYearValue: '',
      householdsCount: '',
      imageUrl: '',
      tags: '',
      description: '',
      note: '',
      fullAddr: '',
      area: '',
      floor: '',
      dir: '',
      avail: '',
      rooms: '',
      date: '',
      parking: '',
      mFee: '',
      priceHTML: '',
      type: '',
      trade: '',
      mapLat: '',
      mapLng: ''
    });

    alert('🥳 새 매물이 성공적으로 직접 등록되었습니다!');
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
    } catch (error) {
      console.error('Error rendering card to image node:', error);
    }
  };

  // Persists Favorites
  useEffect(() => {
    localStorage.setItem('bugang_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Handle Tab Switch
  const handleNavClick = (
    tabName: ActiveTabType,
    sectionId?: string
  ) => {
    setActiveTab(tabName);
    
    // Auto configure category filters based on Top Navbar selections
    if (tabName !== '매물검색' && tabName !== '오시는길' && tabName !== '매물접수') {
      setSelectedCategory(tabName as FilterCategory);
      setActiveSubPills([tabName]);
    } else if (tabName === '매물검색') {
      setSelectedCategory('아파트');
      setActiveSubPills(['아파트']);
    }

    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
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
      const el = document.getElementById('listings-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  // Submit offline inquiry handle
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultName || !consultPhone) {
      alert('성함과 연락처는 필수 입력 항목입니다.');
      return;
    }

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw768QQ_9in5Cr8sUQFtboMBH8spv3ORmRL7tB-rerfkHINBgd6nVp2ru90kM6sJNFYpw/exec';

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: consultName,
          clientPhone: consultPhone,
          message: consultText,
          propertyName: consultType + " / " + consultPropertyId,
          date: new Date().toLocaleString()
        })
      });

      alert('상담 신청이 완료되었습니다!');
      setIsConsultSubmitted(true);
      setConsultName('');
      setConsultPhone('');
      setConsultText('');
      setConsultPropertyId('');
      setTimeout(() => setIsConsultSubmitted(false), 4500);
    } catch (error) {
      alert('전송 중 오류가 발생했습니다.');
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
    } catch (error) {
      console.error('Error rendering modal table to image:', error);
    }
  };

  // ==========================================
  // NAIVE FILTER SYSTEM COMPUTATIONS
  // ==========================================
  
  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      
      // 1. Primary Category Filter System (Split Categories)
      if (selectedCategory) {
        if (prop.category !== selectedCategory) return false;
      }

      // 2. Transaction Type Filter
      if (selectedTransaction !== '전체') {
        if (prop.transactionType !== selectedTransaction) return false;
      }

      // 3. Price Limit Filters
      if (priceLimit !== '전체') {
        const val = parseInt(priceLimit);
        if (prop.priceValue > val) return false;
      }

      // 4. Size Selection Range (in Pyongs)
      if (sizeRange !== '전체') {
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

      // 5. Use approval year filters (신축, 5년, 10년이내)
      if (useYear !== '전체') {
        const currentYear = 2026;
        const age = currentYear - prop.useYearValue;
        if (useYear === '5년이내') {
          if (age > 5) return false;
        } else if (useYear === '10년이내') {
          if (age > 10) return false;
        } else if (useYear === '15년이내') {
          if (age > 15) return false;
        }
      }

      // 6. Household Count limit
      if (householdCount !== '전체') {
        if (householdCount === '대단지') {
          if (prop.householdsCount < 1000) return false;
        }
      }

      // 7. Advanced keyword queries (Fuzzy search)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = prop.name.toLowerCase().includes(query);
        const matchesLoc = prop.location.toLowerCase().includes(query);
        const matchesTags = prop.tags.some(t => t.toLowerCase().includes(query));
        const matchesDesc = prop.description.toLowerCase().includes(query);
        
        if (!matchesName && !matchesLoc && !matchesTags && !matchesDesc) return false;
      }

      return true;
    });
  }, [properties, selectedCategory, activeSubPills, selectedTransaction, priceLimit, sizeRange, useYear, householdCount, searchQuery, favorites]);

  // Dynamic Map Auto Centering based on filtered items, mimicking Naver Real Estate
  useEffect(() => {
    if (filteredProperties.length > 0) {
      const validProps = filteredProperties.filter(p => p.mapLat && p.mapLng);
      if (validProps.length > 0) {
        const avgLat = validProps.reduce((sum, p) => sum + Number(p.mapLat), 0) / validProps.length;
        const avgLng = validProps.reduce((sum, p) => sum + Number(p.mapLng), 0) / validProps.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
      }
    }
  }, [filteredProperties]);

  // Check if Kakao Maps API is fully loaded on the client window, with robust fallback and auto injection
  useEffect(() => {
    const anyWin = window as any;
    
    const checkKakao = () => {
      if (anyWin.kakao && anyWin.kakao.maps) {
        if (anyWin.kakao.maps.load) {
          anyWin.kakao.maps.load(() => {
            setIsKakaoLoaded(true);
          });
        } else {
          setIsKakaoLoaded(true);
        }
        return true;
      }
      return false;
    };

    if (checkKakao()) return;

    // First, scan if script tag is already in index.html or injected
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      let pollRetries = 0;
      const interval = setInterval(() => {
        pollRetries++;
        if (checkKakao()) {
          clearInterval(interval);
        } else if (pollRetries > 40) { // Check up to 20 seconds!
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      // Dynamic injection fallback if index.html script was missing or failed
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=705cc6a6b36051a343295303dfd745ec&libraries=services&autoload=false';
        script.async = true;
        
        script.onload = () => {
          let attempts = 0;
          const checkTimer = setInterval(() => {
            attempts++;
            if (checkKakao()) {
              clearInterval(checkTimer);
            } else if (attempts > 15) {
              clearInterval(checkTimer);
            }
          }, 300);
        };
        
        script.onerror = (e) => {
          console.error("Kakao script load fail:", e);
        };
        
        document.head.appendChild(script);
      } catch (err) {
        console.error("Dynamic injection exception:", err);
      }
    }
  }, []);

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
              className="flex items-center gap-2 cursor-pointer group"
              id="header-logo-area"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center p-1 border border-amber-300/30 shadow-xs group-hover:scale-105 transition-transform">
                <Building className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                  부강공인중개사사무소
                </span>
                <span className="text-[10px] font-extrabold text-neutral-400 tracking-wider">
                  전문 중개 ・ 자문 컨설팅
                </span>
              </div>
            </div>

            {/* Desktop Navigation Menus */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 flex-wrap" id="desktop-nav-menus">
              {[
                { name: '매물검색', id: 'listings-section' },
                { name: '아파트', id: 'listings-section' },
                { name: '오피스텔', id: 'listings-section' },
                { name: '분양권', id: 'listings-section' },
                { name: '원룸', id: 'listings-section' },
                { name: '투룸', id: 'listings-section' },
                { name: '주택', id: 'listings-section' },
                { name: '빌라', id: 'listings-section' },
                { name: '상가', id: 'listings-section' },
                { name: '공장', id: 'listings-section' },
                { name: '토지', id: 'listings-section' },
                { name: '오시는길', id: 'map-section' },
                { name: '매물접수', id: 'inquiry-section' }
              ].map((menu) => {
                const isSelected = activeTab === menu.name;
                return (
                  <button
                    key={menu.name}
                    onClick={() => handleNavClick(menu.name as any, menu.id)}
                    className={`relative px-1.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-extrabold tracking-tight transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'text-amber-700 bg-amber-100/65' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                  >
                    {menu.name}
                    {isSelected && (
                      <motion.span 
                        layoutId="activeTabIndicator" 
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" 
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Contact Call action & Mobile Hamburger */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black border transition-all duration-200 cursor-pointer ${
                  isAdminMode 
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md scale-[1.02]' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="매물 직접 등록 및 관리"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{isAdminMode ? '관리자 On' : '🔑 관리자'}</span>
              </button>

              <a 
                href="tel:051-897-8900" 
                className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm border border-amber-400/20 shadow-xs transition-all tracking-tight"
              >
                <Phone className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>051-897-8900</span>
              </a>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
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
                  {(['매물검색', '아파트', '오피스텔', '분양권', '원룸', '투룸', '주택', '빌라', '상가', '공장', '토지', '오시는길', '매물접수'] as ActiveTabType[]).map((item) => {
                    const isSelected = activeTab === item;
                    return (
                      <button
                        key={item}
                        onClick={() => {
                          if (item === '매물검색' || item === '오시는길' || item === '매물접수') {
                            handleNavClick(item, item === '오시는길' ? 'map-section' : item === '매물접수' ? 'inquiry-section' : 'listings-section');
                          } else {
                            applyPresetFilter(item as FilterCategory, '전체');
                            handleNavClick(item, 'listings-section');
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-black transition-all ${
                          isSelected ? 'bg-amber-50 text-amber-700 font-black border-l-2 border-amber-500' : 'text-slate-700 hover:bg-slate-50'
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
                      setIsAdminMode(!isAdminMode);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-black text-xs transition-colors cursor-pointer ${
                      isAdminMode ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isAdminMode ? '관리자 모드 활성 (On)' : '🔑 중개사 관리자 모드 On'}</span>
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
      <section className="relative bg-gradient-to-b from-amber-100/40 via-amber-200/10 to-transparent border-b border-amber-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/60 text-amber-800 border border-amber-200/50 text-xs font-extrabold mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>부산진구 전문 공인중개사사무소</span>
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight mb-4">
            부산진구 매물, <span className="text-amber-600 underline decoration-amber-300">한눈에 찾기</span>
          </h1>
          
          <p className="text-slate-500 text-xs sm:text-sm font-bold max-w-xl mx-auto leading-relaxed mb-8">
            양정, 개금, 서면, 범천동 아파트부터 분양권, 공장/토지 매물까지!<br />
            실제 매매 시세에 기반한 완벽한 허위매물 제로 100% 실매물로 매칭합니다.
          </p>

          {/* ==========================================
              NAVER REAL ESTATE STYLE FILTER STATION (Frosted Card)
              ========================================== */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto bg-white/85 backdrop-blur-lg rounded-2xl shadow-xl border border-amber-200/60 p-4 sm:p-5"
            id="naver-filter-station"
          >
            <div className="flex flex-col gap-4">
              
              {/* Category selector row */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-amber-150/40 pb-3 h-auto max-h-[120px] overflow-y-auto" id="naver-main-categories">
                {[
                  { label: '아파트', value: '아파트' },
                  { label: '오피스텔', value: '오피스텔' },
                  { label: '분양권', value: '분양권' },
                  { label: '원룸', value: '원룸' },
                  { label: '투룸', value: '투룸' },
                  { label: '주택', value: '주택' },
                  { label: '빌라', value: '빌라' },
                  { label: '상가', value: '상가' },
                  { label: '공장', value: '공장' },
                  { label: '토지', value: '토지' }
                ].map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value as FilterCategory);
                      setActiveSubPills([cat.value]);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === cat.value
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-100/60 text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Transaction & Price & Size dropbar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 gap-2" id="naver-dropdowns-bar">
                
                {/* Transaction type pill selectors */}
                <div className="col-span-2 bg-slate-100/80 p-0.5 rounded-xl flex items-center">
                  {(['전체', '매매', '전세', '월세'] as TransactionType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedTransaction(type)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        selectedTransaction === type
                          ? 'bg-white text-slate-950 shadow-xs ring-1 ring-amber-400/20'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Price Limit Selector */}
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-1 cursor-pointer transition-all ${
                      priceLimit !== '전체'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{priceLimit === '전체' ? '가격대' : `${parseInt(priceLimit)/10000}억 이하`}</span>
                    <span className="text-[9px] text-slate-400">▼</span>
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'price' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 top-9 bg-white border border-amber-300/30 rounded-xl shadow-xl z-50 p-1.5 min-w-[140px] flex flex-col gap-0.5"
                      >
                        {[
                          { label: '전체 가격대', value: '전체' },
                          { label: '1억 이하', value: '10000' },
                          { label: '2.5억 이하', value: '25000' },
                          { label: '4억 이하', value: '40000' },
                          { label: '6억 이하', value: '60000' },
                          { label: '10억 이하', value: '100000' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setPriceLimit(opt.value);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                              priceLimit === opt.value
                                ? 'bg-amber-100 text-amber-850'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Size Limit Selector */}
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === 'size' ? null : 'size')}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-1 cursor-pointer transition-all ${
                      sizeRange !== '전체'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{sizeRange === '전체' ? '면적(평수)' : sizeRange}</span>
                    <span className="text-[9px] text-slate-400">▼</span>
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'size' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 top-9 bg-white border border-amber-300/30 rounded-xl shadow-xl z-50 p-1.5 min-w-[140px] flex flex-col gap-0.5"
                      >
                        {[
                          { label: '전체 면적', value: '전체' },
                          { label: '10평대 (10~19평)', value: '10평대' },
                          { label: '20평대 (20~29평)', value: '20평대' },
                          { label: '30평대 (30~29평)', value: '30평대' },
                          { label: '40평대 이상', value: '40평대이상' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSizeRange(opt.value);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                              sizeRange === opt.value
                                ? 'bg-amber-100 text-amber-850'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Approved Year Selector */}
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === 'year' ? null : 'year')}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-1 cursor-pointer transition-all ${
                      useYear !== '전체'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{useYear === '전체' ? '연식' : useYear}</span>
                    <span className="text-[9px] text-slate-400">▼</span>
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'year' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 top-9 bg-white border border-amber-300/30 rounded-xl shadow-xl z-50 p-1.5 min-w-[140px] flex flex-col gap-0.5"
                      >
                        {[
                          { label: '전체 연식', value: '전체' },
                          { label: '신축급 (5년이내)', value: '5년이내' },
                          { label: '10년 이내', value: '10년이내' },
                          { label: '15년 이내', value: '15년이내' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setUseYear(opt.value);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                              useYear === opt.value
                                ? 'bg-amber-100 text-amber-850'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Household Count Selector */}
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === 'households' ? null : 'households')}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-1 cursor-pointer transition-all ${
                      householdCount !== '전체'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{householdCount === '전체' ? '세대수' : '대단지'}</span>
                    <span className="text-[9px] text-slate-400">▼</span>
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'households' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 sm:left-0 top-9 bg-white border border-amber-300/30 rounded-xl shadow-xl z-50 p-1.5 min-w-[140px] flex flex-col gap-0.5"
                      >
                        {[
                          { label: '전체 세대수', value: '전체' },
                          { label: '1000세대 이상 대단지', value: '대단지' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setHouseholdCount(opt.value);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                              householdCount === opt.value
                                ? 'bg-amber-100 text-amber-850'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Advanced Search toggle panel button */}
                <button
                  onClick={() => {
                    setAdvancedSearch(!advancedSearch);
                    setActiveDropdown(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    advancedSearch || searchQuery !== ''
                      ? 'bg-amber-100 border border-amber-400/30 text-amber-800'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>키워드</span>
                </button>

              </div>

              {/* Advanced Search Bar Option (Horizontal expand) */}
              <AnimatePresence>
                {(advancedSearch || searchQuery !== '') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-amber-100 pt-3 flex flex-col sm:flex-row gap-3 items-center justify-between overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mr-auto">
                      <Search className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>매물명, 단지명 또는 관심 키워드 검색:</span>
                    </div>
                    <div className="relative w-full sm:w-80">
                      <input
                        type="text"
                        placeholder="양정, 서면, 한라, 공장, 신축 등으로 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-white border border-amber-200 rounded-lg pl-3 pr-8 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 font-bold"
                      />
                      {searchQuery ? (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>



              {/* Reset active filtering controllers */}
              {(selectedCategory !== '아파트 오피스텔' || selectedTransaction !== '전체' || priceLimit !== '전체' || sizeRange !== '전체' || useYear !== '전체' || householdCount !== '전체' || searchQuery !== '') && (
                <div className="flex justify-between items-center pt-2.5 border-t border-amber-100 text-xs">
                  <span className="text-slate-400 font-extrabold">네이버 부동산 스타일의 필터링이 가동 중입니다.</span>
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
                      setAdvancedSearch(false);
                      setActiveDropdown(null);
                    }}
                    className="text-xs text-amber-600 hover:text-amber-700 font-black flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    모든 필터 초기화
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          QUICK ACCORD PRESETS (Bento Bar Style)
          ========================================== */}
      <section className="bg-amber-100/10 py-5 border-b border-amber-200/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
          <span className="font-extrabold text-slate-400 flex items-center gap-1 mr-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            빠른 탐색:
          </span>
          <button 
            onClick={() => applyPresetFilter('아파트', '매매')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            아파트 매매
          </button>
          <button 
            onClick={() => applyPresetFilter('오피스텔', '전세')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            오피스텔 전세
          </button>
          <button 
            onClick={() => applyPresetFilter('원룸', '월세')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            역세권 원룸 월세
          </button>
          <button 
            onClick={() => applyPresetFilter('분양권', '전체')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            양정 신축 분양권
          </button>
          <button 
            onClick={() => applyPresetFilter('공장', '전체')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            개발 공장 매매
          </button>
        </div>
      </section>

      {/* ==========================================
          MAIN AREA: GRID LISTINGS & CONSULT SIDEBAR
          ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow" id="listings-section">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Properties Listings Grid (3/4 column) */}
          <div className="lg:col-span-3 flex flex-col gap-6" id="listings-container">
            
            {/* Title / Info row with View Mode Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-3.5 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedCategory} 매물 목록
                </span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2 py-0.5 rounded-full">
                  실시간 {filteredProperties.length}개 발견
                </span>
              </div>
              
              {/* Naver Real Estate View Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40 shadow-xs self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-amber-900 shadow-sm'
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
                      ? 'bg-white text-amber-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
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
                      매물장에 땡겨오며 발생하던 동기화 지연/오류 없이, 브라우저가 관리하는 수동 매물장입니다.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddForm ? '등록 폼 접기' : '새 매물 직접 등록하기'}</span>
                  </button>
                </div>

                {showAddForm && (
                  <form onSubmit={handleRegisterProperty} id="register-property-form" className="bg-white border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-md">
                    <div className="border-b border-amber-100 pb-2.5">
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 bg-amber-50/50 -mx-6 -mt-6 px-6 py-3 rounded-t-2xl border-b border-amber-200">
                        <Building className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>의무 고시 사항 중심 13대 필수항목 순차 입력 폼</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-2">
                        소장이 직접 관리하는 수동 매물장입니다. 입력하신 순서대로 매물 요약표에 즉시 반영됩니다.
                      </p>
                    </div>

                    {/* Basic visual identification */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 bg-slate-50/55 p-3 rounded-xl border border-slate-100">
                      <div className="col-span-1 sm:col-span-2">
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
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">🖼️ 대표 이미지 인터넷 주소 URL</label>
                        <input
                          type="text"
                          value={newProp.imageUrl}
                          onChange={(e) => setNewProp(prev => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="예: https://images.unsplash.com/photo-..."
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Step 1 to 13 Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      
                      {/* 1. 소재지 */}
                      <div className="md:col-span-2 bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 flex flex-col justify-between">
                        <div>
                          <label className="block text-[11px] font-black text-amber-900 mb-1">1. 소재지 (지번/도로명 주소) *</label>
                          <input
                            type="text"
                            required
                            id="full-addr-input"
                            value={newProp.fullAddr}
                            onChange={(e) => setNewProp(prev => ({ ...prev, fullAddr: e.target.value }))}
                            placeholder="예: 부산광역시 부산진구 냉정로 273 (범천동)"
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                          />
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
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-lg py-2 px-2 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Search className="w-3.5 h-3.5 text-amber-400" />
                              <span>카카오지도로 좌표 검색</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2. 면적 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">2. 면적 (고시 내용 및 평수) *</label>
                        <input
                          type="text"
                          required
                          value={newProp.area}
                          onChange={(e) => setNewProp(prev => ({ ...prev, area: e.target.value }))}
                          placeholder="예: 공급 112㎡ / 전용 84㎡"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900 mb-2"
                        />
                        <div className="relative">
                          <input
                            type="number"
                            required
                            value={newProp.pyongValue}
                            onChange={(e) => setNewProp(prev => ({ ...prev, pyongValue: e.target.value }))}
                            placeholder="평수: 34"
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900 pr-6"
                          />
                          <span className="absolute right-2 top-2 text-xs font-black text-slate-400">평</span>
                        </div>
                      </div>

                      {/* 3. 가격 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-black text-amber-900 mb-1">3. 가격 (보증금/월세 텍스트 및 정렬용) *</label>
                          <input
                            type="text"
                            required
                            value={newProp.priceText}
                            onChange={(e) => setNewProp(prev => ({ ...prev, priceText: e.target.value }))}
                            placeholder="예: 4억 8,500만 또는 보증금 1,000 / 월 60만"
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500">수치값(정렬용_만원)</label>
                          <input
                            type="number"
                            required
                            value={newProp.priceValue}
                            onChange={(e) => setNewProp(prev => ({ ...prev, priceValue: e.target.value }))}
                            placeholder="예: 48500"
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500">월세액(만원_옵션)</label>
                          <input
                            type="number"
                            value={newProp.rentValue}
                            onChange={(e) => setNewProp(prev => ({ ...prev, rentValue: e.target.value }))}
                            placeholder="예: 60"
                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                          />
                        </div>
                        <div className="flex items-end text-[10px] text-slate-400 font-extrabold pb-1">
                          수치형은 연식/정렬 필터 핵심
                        </div>
                      </div>

                      {/* 4. 중개대상물 종류 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">4. 중개대상물 종류 *</label>
                        <select
                          value={newProp.category}
                          onChange={(e) => setNewProp(prev => ({ ...prev, category: e.target.value as any }))}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold bg-white text-slate-900"
                        >
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

                      {/* 5. 거래형태 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">5. 거래형태 *</label>
                        <select
                          value={newProp.transactionType}
                          onChange={(e) => setNewProp(prev => ({ ...prev, transactionType: e.target.value as any }))}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold bg-white text-slate-900"
                        >
                          <option value="매매">매매</option>
                          <option value="전세">전세</option>
                          <option value="월세">월세</option>
                        </select>
                      </div>

                      {/* 6. 층수 / 총 층수 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">6. 층수 / 총 층수 *</label>
                        <input
                          type="text"
                          required
                          value={newProp.floor}
                          onChange={(e) => setNewProp(prev => ({ ...prev, floor: e.target.value }))}
                          placeholder="예: 15층 / 총 25층"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900 mb-2"
                        />
                        <input
                          type="text"
                          value={newProp.floorText}
                          onChange={(e) => setNewProp(prev => ({ ...prev, floorText: e.target.value }))}
                          placeholder="간략표시 예: 15층/25층"
                          className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-700"
                        />
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
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>

                      {/* 8. 방 수 / 욕실 수 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">8. 방 수 / 욕실 수 *</label>
                        <input
                          type="text"
                          required
                          value={newProp.rooms}
                          onChange={(e) => setNewProp(prev => ({ ...prev, rooms: e.target.value }))}
                          placeholder="예: 방 3개 / 욕실 2개"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>

                      {/* 9. 사용승인일 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">9. 사용승인일 *</label>
                        <input
                          type="text"
                          required
                          value={newProp.date}
                          onChange={(e) => setNewProp(prev => ({ ...prev, date: e.target.value }))}
                          placeholder="예: 2019.05.20"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900 mb-2"
                        />
                        <input
                          type="number"
                          required
                          value={newProp.useYearValue}
                          onChange={(e) => setNewProp(prev => ({ ...prev, useYearValue: e.target.value }))}
                          placeholder="준공년도 예: 2019"
                          className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-700"
                        />
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
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
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
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900"
                        />
                      </div>

                      {/* 12. 방향 */}
                      <div className="bg-amber-50/20 p-3 rounded-xl border border-amber-100/60">
                        <label className="block text-[11px] font-black text-amber-900 mb-1">12. 방향 *</label>
                        <input
                          type="text"
                          required
                          value={newProp.dir}
                          onChange={(e) => setNewProp(prev => ({ ...prev, dir: e.target.value }))}
                          placeholder="예: 남서향 (거실 기준)"
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-900 mb-2"
                        />
                        <input
                          type="text"
                          value={newProp.direction}
                          onChange={(e) => setNewProp(prev => ({ ...prev, direction: e.target.value }))}
                          placeholder="간략명 예: 남서향"
                          className="w-full text-[11px] border border-slate-200 bg-white rounded-lg p-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold text-slate-700"
                        />
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
                              placeholder="예: 35.1535"
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
                              placeholder="예: 129.0185"
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

                    <button
                      type="submit"
                      className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-4 rounded-xl cursor-pointer transition-transform hover:scale-[1.005] duration-150 text-xs text-center flex items-center justify-center gap-2 shadow-sm"
                    >
                      🚀 부강공인중개사 소장 전속 매물장에 수동 등록하기
                    </button>
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch bg-white rounded-3xl p-3 border border-amber-200/50 shadow-xs">
                
                {/* Left Listing Feed: Compact horizontal row items (md:col-span-5) */}
                <div className="md:col-span-5 flex flex-col gap-3.5 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  <div className="bg-amber-50/50 text-slate-600 text-[11px] font-bold p-3 rounded-xl border border-amber-100/60 flex items-center gap-2 justify-center">
                    <Info className="w-4 h-4 text-amber-500 animate-bounce" />
                    <span>원하는 매물을 클릭하면 지도가 알아서 움직입니다.</span>
                  </div>

                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredProperties.map((prop, index) => {
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
                          className={`group p-3 rounded-xl border transition-all duration-200 cursor-pointer flex gap-3 relative bg-white ${
                            isHovered || isActive
                              ? 'border-amber-400 bg-amber-50/20 shadow-sm ring-1 ring-amber-400/20'
                              : 'border-slate-100 hover:border-amber-300 hover:bg-slate-55/35'
                          }`}
                          onMouseEnter={() => setHoveredPropertyId(prop.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          onClick={() => {
                            setMapCenter({ lat: prop.mapLat, lng: prop.mapLng });
                            setActiveMarkerId(prop.id);
                          }}
                          id={`map-property-${prop.id}`}
                        >
                          {/* Image container on Left */}
                          <div className="w-24 sm:w-28 h-20 sm:h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative shadow-inner">
                            <img
                              src={prop.imageUrl}
                              alt={prop.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Category Badge */}
                            <span className="absolute left-1 top-1 bg-slate-950/80 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {prop.category}
                            </span>
                          </div>

                          {/* Data block on Right */}
                          <div className="flex flex-col justify-between flex-grow min-w-0">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-amber-600 font-extrabold text-[11px]">
                                  {prop.transactionType} <strong className="text-slate-900 text-xs sm:text-sm font-black">{prop.priceText}</strong>
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(prop.id, e);
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-all"
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                </button>
                              </div>
                              
                              <h4 className="text-[11px] sm:text-xs font-black text-slate-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
                                {prop.name}
                              </h4>
                              
                              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-1 tracking-tight flex items-center gap-1">
                                <span className="bg-slate-100 px-1 py-0.2 rounded font-black text-slate-500">{prop.pyongValue}평</span>
                                <span>|</span>
                                <span>{prop.floorText.split('/')[0]}</span>
                                <span>|</span>
                                <span className="truncate max-w-[90px]">{prop.direction}</span>
                              </p>
                            </div>

                            {/* CTAs */}
                            <div className="flex items-center gap-1.5 mt-1 border-t border-slate-50 pt-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailsAndSetInquiry(prop);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] sm:text-[10px] font-black py-1 px-2.5 rounded-lg flex items-center gap-0.5 transition-colors cursor-pointer"
                              >
                                <span>상세상담</span>
                                <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveAsImage(prop.id);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] sm:text-[10px] font-bold py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                              >
                                이미지저장
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Right Interactive Kakao Map Panel (md:col-span-7) */}
                <div className="md:col-span-7 h-[400px] md:h-[700px] rounded-2xl border border-amber-200/40 shadow-sm relative overflow-hidden bg-slate-50 flex flex-col justify-between">
                  {/* Map Header Diagnostics Button Row */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2 items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={() => setShowKakaoGuide(!showKakaoGuide)}
                      className="pointer-events-auto bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-xl border border-amber-600/20 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                    >
                      <span>🛠️ 지도가 안 보이시나요? (도메인 설정)</span>
                    </button>
                    {!isKakaoLoaded && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm animate-pulse">
                        카카오 지도 로드 대기 중...
                      </span>
                    )}
                  </div>

                  {/* Troubleshooting Guide Box overlay when requested */}
                  <AnimatePresence>
                    {((showKakaoGuide || !isKakaoLoaded) && !forceShowMap) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-5 text-white flex flex-col justify-between overflow-y-auto"
                      >
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-sm font-black text-amber-400 flex items-center gap-1.5 align-middle">
                              <span>💡 카카오 지도 연결 및 보안 가이드</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (!(window as any).kakao?.maps) {
                                  alert("⚠️ 카카오 지도 SDK가 아직 로드되지 않았습니다. 현재 창에 광고 차단(AdBlock, Brave Shield)이 켜져 있거나 iframe 차단 상태입니다. 상단의 '새 창으로 앱 열기'나 광고차단 해제를 이용해주세요.");
                                } else {
                                  setShowKakaoGuide(false);
                                  setForceShowMap(true);
                                }
                              }}
                              className="text-slate-400 hover:text-white text-xs font-black cursor-pointer bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg"
                            >
                              닫기 ✕
                            </button>
                          </div>

                          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                            개발자 콘솔에 도메인을 정상 수정한 이후에도 지도가 뜨지 않는 경우, <strong className="text-amber-300">세 가지 체크리스트</strong>를 확인해 주세요:
                          </p>

                          {/* Major Checklists */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                              <span className="font-extrabold text-amber-400 block mb-1">🛡️ 1. 광고 차단 프로그램 (AdBlock, Brave)</span>
                              <span className="text-slate-400 leading-normal">
                                AdBlock, 유니콘, Brave Shield 등은 카카오 도메인을 광고망으로 오작동 차단합니다. <strong>광고 차단을 임시 해제</strong>해 주세요!
                              </span>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                              <span className="font-extrabold text-amber-400 block mb-1">🔗 2. Iframe 보안 제한 우회 (강력 추천)</span>
                              <span className="text-slate-400 leading-normal">
                                현재 보고 계신 개발 콘솔의 iframe 환경에서는 세션 보안으로 인해 스크립트가 누락될 수 있습니다. <strong>아래의 '새 창으로 앱 열기' 버튼</strong>을 클릭해 독립 탭에서 지도를 바로 로딩할 수 있습니다.
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl space-y-1.5">
                            <h5 className="text-[11px] font-black text-slate-200">🛠️ 이미 하셨겠지만 다시 점검하기 (Kakao Web 도메인 기준):</h5>
                            <ol className="text-[10px] text-slate-400 space-y-0.5 list-decimal list-inside font-semibold leading-relaxed">
                              <li><a href="https://developers.kakao.com" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">카카오 개발자 콘솔</a> ➔ [플랫폼] ➔ [Web 도메인] 등록</li>
                              <li>포트 번호 (<code className="text-amber-200">:3000</code>, <code className="text-amber-200">:5173</code> 등) 및 뒤에 슬래시(기울임표) 유무 일치 확인</li>
                            </ol>
                          </div>

                          <div className="bg-slate-900 border border-slate-800/80 p-2 rounded-xl">
                            <h5 className="text-[10px] font-black text-amber-500 mb-0.5">등록된 서버 도메인 목록:</h5>
                            <div className="font-mono text-[9px] text-slate-300 space-y-0.5 select-all">
                              <div>http://localhost:3000</div>
                              <div>https://ais-dev-2o5kuleeq74mr5w55gcxnr-517818131161.asia-northeast1.run.app</div>
                              <div>https://ais-pre-2o5kuleeq74mr5w55gcxnr-517818131161.asia-northeast1.run.app</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-900 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(window.location.href, '_blank')}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-black py-2.5 px-4 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>🚀 새 창에서 앱 열기 (보안/iframe 최적 우회)</span>
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
                              if (!(window as any).kakao?.maps) {
                                alert("⚠️ 현재 브라우저에 카카오 지도 SDK 파일 로딩 자체가 차단되었습니다. 크롬 광고차단 플러그인을 종료해 주시거나 꼭 '새 창에서 앱 열기' 버튼을 클릭해 실시간 지도를 열어보세요!");
                              } else {
                                setShowKakaoGuide(false);
                                setForceShowMap(true);
                              }
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 text-xs font-black rounded-xl cursor-pointer"
                          >
                            강제로 지도 켜기
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actual Map component or beautiful fallback if script is blocking */}
                  {(isKakaoLoaded || forceShowMap) ? (
                    <Map
                      center={mapCenter}
                      style={{ width: "100%", height: "100%" }}
                      level={4}
                    >
                      {/* Listings interactive pins */}
                      {filteredProperties.map((prop) => {
                        const isHovered = hoveredPropertyId === prop.id;
                        const isActive = activeMarkerId === prop.id;
                        
                        return (
                          <MapMarker
                            key={prop.id}
                            position={{ lat: prop.mapLat, lng: prop.mapLng }}
                            onClick={() => {
                              setMapCenter({ lat: prop.mapLat, lng: prop.mapLng });
                              setActiveMarkerId(prop.id);
                            }}
                            image={{
                              src: isActive 
                                ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png"
                                : "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                              size: isActive 
                                ? { width: 31, height: 35 }
                                : isHovered 
                                ? { width: 28, height: 39 }
                                : { width: 24, height: 35 }
                            }}
                          >
                            <div className={`p-1.5 text-[10px] font-black rounded border cursor-pointer max-w-[170px] transition-all bg-white shadow-md ${
                              isActive 
                                ? 'border-red-500 text-red-800 scale-102 ring-1 ring-red-400/30'
                                : isHovered
                                ? 'border-amber-400 text-amber-900 scale-101'
                                : 'border-slate-200 text-slate-800'
                            }`}
                            onDoubleClick={() => openDetailsAndSetInquiry(prop)}
                            >
                              <div className="flex gap-1 items-center">
                                <span className={`text-[8px] print:hidden px-1 rounded-sm text-white font-black ${
                                  prop.transactionType === '매매' ? 'bg-indigo-500' : prop.transactionType === '전세' ? 'bg-amber-500' : 'bg-green-500'
                                }`}>
                                  {prop.transactionType}
                                </span>
                                <span className="truncate">{prop.name.replace(' 아파트', '')}</span>
                              </div>
                              <div className="text-amber-700 font-extrabold text-[10px] mt-0.5">{prop.priceText}</div>
                            </div>
                          </MapMarker>
                        );
                      })}
                    </Map>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-600 animate-spin">
                        🔄
                      </div>
                      <div className="text-center">
                        <p className="text-slate-600 font-black text-sm">카카오 지도 시스템 로딩 중...</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-1">도메인 차단 시 위쪽 '지도가 안 보이시나요?' 버튼을 클릭하세요.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Floating map controls instruction overlay */}
                  <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-slate-700/50 text-[10px] font-semibold flex items-center gap-1.5 z-10 shadow-md">
                    <Navigation className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>핀 클릭: 매물 지정 | 더블 클릭: 상세 정보 카드 열기</span>
                  </div>
                </div>

              </div>
            ) : (
              /* Original Grid View Layout */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredProperties.map((prop, index) => {
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
                                src={prop.imageUrl} 
                                alt={prop.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                              {/* Floating Delete button if Admin active */}
                              {isAdminMode && (
                                <button
                                  onClick={(e) => handleDeleteProperty(prop.id, e)}
                                  className="absolute left-3.5 top-3.5 p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer z-10 transition-transform hover:scale-105"
                                  title="매물 즉시 삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Dynamic transaction Category badge */}
                              <div className="absolute left-3.5 bottom-3.5 flex flex-col gap-1 items-start">
                                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  {prop.category}
                                </span>
                                <span className="text-white text-sm sm:text-base font-black tracking-tight drop-shadow-sm/85">
                                  {prop.transactionType} {prop.priceText}
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
            )}
          </div>

          {/* Consultation Form Sidebar (1/4 column) */}
          <div className="lg:col-span-1" id="inquiry-section">
            <div className="sticky top-24 bg-white/80 backdrop-blur-md rounded-2xl border border-amber-200/60 p-5 shadow-lg flex flex-col gap-5">
              
              <div className="border-b border-amber-100 pb-3">
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm sm:text-base">
                  <Mail className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                  <span>실시간 온라인 상담 신청</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">
                  남겨주시면 부강 대표 고민주 소장이 직접 1시간 이내 신속 대조 연락 드립니다.
                </p>
              </div>
            
              {/* Instant Status Counter */}
              <form onSubmit={handleInquirySubmit} className="flex flex-col gap-3">
  
  <input
    type="text"
    placeholder="성함"
    value={consultName}
    onChange={(e) => setConsultName(e.target.value)}
    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
  />

  <input
    type="tel"
    placeholder="연락처"
    value={consultPhone}
    onChange={(e) => setConsultPhone(e.target.value)}
    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
  />

  <select
    value={consultType}
    onChange={(e) => setConsultType(e.target.value)}
    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
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
    rows={5}
    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
  />

  <button
    type="submit"
    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl transition-colors"
  >
    상담 신청 보내기
  </button>

</form>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-center justify-between text-center">
                <div className="flex-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">금일 상담접수</div>
                  <div className="text-sm font-black text-slate-800">14건</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="flex-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">평균 대응</div>
                  <div className="text-sm font-black text-amber-600">30분 내</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

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
              부강공인중개사사무소로 오시는 길
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-bold leading-relaxed">
              서면역, 개금역 인근 및 냉정로 273 큰 대로변 1층에 자리하고 있어 쉽게 발견하실 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Visual Vector Simulated Map (8 columns for gorgeous UI map layout) */}
            <div className="lg:col-span-8 bg-amber-50/10 rounded-2xl border border-amber-200/50 relative overflow-hidden min-h-[480px] p-4 flex flex-col justify-between">
              
              {/* Map Absolute Overlay Banner */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-amber-200/50 shadow-sm z-10 text-xs flex flex-col gap-0.5">
                <span className="font-black text-slate-900 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-amber-500" />
                  냉정로 1층 초록색 대간판 「부강 부동산」
                </span>
                <span className="text-[10px] text-slate-400 font-bold">오프라인 차량 주차 상시 무료 지원 가능</span>
              </div>

              {/* Kakao Map Component Container */}
              <div className="w-full h-[400px] rounded-2xl overflow-hidden relative border border-slate-105 shadow-inner mt-11 bg-slate-100 flex items-center justify-center">
                {(isKakaoLoaded || forceShowMap) ? (
                  <Map
                    center={{ lat: 35.1542, lng: 129.0195 }}
                    style={{ width: "100%", height: "100%" }}
                    level={4}
                  >
                    {/* Office Pin */}
                    <MapMarker
                      position={{ lat: 35.1542, lng: 129.0195 }}
                    >
                      <div className="p-2 text-xs font-black text-slate-900 bg-white border border-amber-300 rounded shadow-md max-w-[180px]">
                        🏢 부강공인중개사사무소
                        <div className="text-[9px] text-amber-600 font-extrabold mt-0.5">냉정로 273 (1층)</div>
                      </div>
                    </MapMarker>

                    {/* Listings Markers */}
                    {filteredProperties.map((prop) => (
                      <MapMarker
                        key={prop.id}
                        position={{ lat: prop.mapLat, lng: prop.mapLng }}
                        onClick={() => openDetailsAndSetInquiry(prop)}
                        image={{
                          src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                          size: { width: 24, height: 35 }
                        }}
                      >
                        <div className="p-1.5 text-[10px] font-black text-slate-800 bg-white border border-slate-200 rounded shadow max-w-[160px] truncate cursor-pointer">
                          <span className="text-[9px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded mr-1">
                            {prop.transactionType}
                          </span>
                          {prop.name.replace(' 아파트', '')}
                          <div className="text-amber-800 font-extrabold mt-0.5">{prop.priceText}</div>
                        </div>
                      </MapMarker>
                    ))}
                  </Map>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-slate-400 gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-600 animate-spin">
                      🔄
                    </div>
                    <p className="text-slate-600 font-black text-xs">오시는 길 지도 준비 중...</p>
                  </div>
                )}
              </div>

              {/* Instructions list below */}
              <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/50 text-slate-600 font-semibold text-[10px] sm:text-xs tracking-tight flex flex-col gap-1 mt-4">
                <span className="font-extrabold text-[#F59E0B] block">🚗 승용차 방문시:</span>
                <p>네비게이션에 대놓고 <span className="font-black text-slate-800 underline decoration-amber-400">냉정로 273</span> 입력후 정주행 하시면, 매장 바로 좌측 주차장에 무료 주차 가능합니다.</p>
              </div>

            </div>

            {/* Address & office credentials list (4 columns) */}
            <div className="lg:col-span-4 bg-slide-amber/2 bg-amber-100/15 border border-amber-250/20 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-6">
              
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-amber-200/30 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center p-1 font-black text-slate-950">
                    ★
                  </div>
                  <span className="font-black text-slate-950 text-base sm:text-lg">사무소 핵심 개요</span>
                </div>

                <div className="flex flex-col gap-4 text-xs font-semibold">
                  
                  {/* Address */}
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 font-extrabold">사무실 대표 도로명 소재지</span>
                    <p className="text-slate-800 text-sm font-black flex items-start gap-1">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>부산광역시 부산진구 냉정로 273 1층 (부강 부동산)</span>
                    </p>
                  </div>

                  {/* Representative name */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-slate-400 font-extrabold">소속 대표 공인중개사</span>
                    <p className="text-slate-800 text-sm font-black flex items-center gap-1">
                      <Home className="w-4 h-4 text-amber-500" />
                      <span>대표 고민주 소장</span>
                    </p>
                  </div>

                  {/* Contacts */}
                  <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-amber-200/20">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>대표 유선 전화:</span>
                      <a href="tel:051-897-8900" className="font-black text-amber-600 hover:underline">051-897-8900</a>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>팩스 연락처:</span>
                      <span className="font-black text-slate-900">051-897-9004</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>대표 이메일 주소:</span>
                      <a href="mailto:junku97@naver.com" className="font-black text-slate-900 hover:underline">junku97@naver.com</a>
                    </div>
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
                
                {/* Large Preview */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-150">
                  <img 
                    src={selectedProperty.imageUrl} 
                    alt={selectedProperty.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  
                  {/* Status Banner */}
                  <div className="absolute bottom-4 left-4">
                    <span className="text-xs text-amber-300 font-extrabold uppercase">매물 안내 실시간</span>
                    <p className="text-white text-lg sm:text-xl font-black mt-0.5">
                      {selectedProperty.transactionType} {selectedProperty.priceText}
                    </p>
                  </div>
                </div>

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
                부강공인중개사사무소
              </span>
            </div>
            
            <p className="text-[11px] leading-relaxed text-slate-450 max-w-sm">
              부산광역시 부산진구 냉정로 일대 전문 중개업으로 등록 인가받은 부강공인중개사사무소입니다. 허위매물 무조건 0% 사명감 실매물 제도의 철두철미한 투명 중개를 맹세합니다.
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
              Copyright © {new Date().getFullYear()} 부강공인중개사사무소. All Rights Reserved.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
