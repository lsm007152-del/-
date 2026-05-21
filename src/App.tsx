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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

// ==========================================
// TYPES & INTERFACES DEFINITIONS
// ==========================================

export type TransactionType = '전체' | '매매' | '전세' | '월세';
export type FilterCategory = '아파트・오피스텔' | '분양권' | '공장・토지' | '상가・사무실' | '우리집' | 'MY관심';

export interface Property {
  id: string;
  name: string;
  category: '아파트' | '오피스텔' | '분양권' | '공장/토지' | '상가/사무실';
  transactionType: '매매' | '전세' | '월세';
  priceText: string;
  priceValue: number; // For filtering (in ten million KRW units, e.g. 45000 for 4.5억)
  rentValue?: number; // In ten thousand KRW units (for 월세)
  pyongValue: number; // Area in Pyong (평)
  floorText: string;
  direction: string;
  location: string;
  useYearText: string;
  useYearValue: number; // e.g., 2022 (year built)
  householdsCount: number; // e.g. 1200 or 0 for land
  imageUrl: string;
  tags: string[];
  description: string;
  features: string[];
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
    category: '공장/토지',
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
    category: '상가/사무실',
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
    category: '오피스텔',
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
    category: '상가/사무실',
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
  }
];

export default function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'매물검색' | '분양권' | '공장/토지' | '오시는길'>('매물검색');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('아파트・오피스텔');

  // Filter conditions
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType>('전체');
  const [priceLimit, setPriceLimit] = useState<string>('전체');
  const [sizeRange, setSizeRange] = useState<string>('전체');
  const [useYear, setUseYear] = useState<string>('전체');
  const [householdCount, setHouseholdCount] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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

  // Active sub-pills for sub categories inside "아파트/오피스텔" filter
  const [activeSubPills, setActiveSubPills] = useState<string[]>(['아파트', '오피스텔']);

  // Persists Favorites
  useEffect(() => {
    localStorage.setItem('bugang_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Handle Tab Switch
  const handleNavClick = (tabName: '매물검색' | '분양권' | '공장/토지' | '오시는길', sectionId?: string) => {
    setActiveTab(tabName);
    
    // Auto configure category filters based on Top Navbar selections
    if (tabName === '매물검색') {
      setSelectedCategory('아파트・오피스텔');
      setActiveSubPills(['아파트', '오피스텔']);
    } else if (tabName === '분양권') {
      setSelectedCategory('분양권');
      setActiveSubPills(['분양권']);
    } else if (tabName === '공장/토지') {
      setSelectedCategory('공장・토지');
      setActiveSubPills(['공장/토지']);
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
  const applyPresetFilter = (category: '아파트' | '오피스텔' | '분양권' | '공장/토지', transaction: TransactionType) => {
    setSearchQuery('');
    setAdvancedSearch(false);
    setSelectedTransaction(transaction);
    setPriceLimit('전체');
    setSizeRange('전체');
    setUseYear('전체');
    setHouseholdCount('전체');
    
    if (category === '아파트') {
      setSelectedCategory('아파트・오피스텔');
      setActiveSubPills(['아파트']);
      setActiveTab('매물검색');
    } else if (category === '오피스텔') {
      setSelectedCategory('아파트・오피스텔');
      setActiveSubPills(['오피스텔']);
      setActiveTab('매물검색');
    } else if (category === '분양권') {
      setSelectedCategory('분양권');
      setActiveSubPills(['분양권']);
      setActiveTab('분양권');
    } else if (category === '공장/토지') {
      setSelectedCategory('공장・토지');
      setActiveSubPills(['공장/토지']);
      setActiveTab('공장/토지');
    }

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

  // ==========================================
  // NAIVE FILTER SYSTEM COMPUTATIONS
  // ==========================================
  
  const filteredProperties = useMemo(() => {
    return INITIAL_PROPERTIES.filter(prop => {
      
      // 1. Primary Category Filter System (Left sidebar or Top Categories)
      if (selectedCategory === '아파트・오피스텔') {
        const matchingSub = activeSubPills.includes(prop.category);
        if (!matchingSub) return false;
      } else if (selectedCategory === '분양권') {
        if (prop.category !== '분양권') return false;
      } else if (selectedCategory === '공장・토지') {
        if (prop.category !== '공장/토지') return false;
      } else if (selectedCategory === '상가・사무실') {
        if (prop.category !== '상가/사무실') return false;
      } else if (selectedCategory === 'MY관심') {
        if (!favorites.includes(prop.id)) return false;
      } else if (selectedCategory === '우리집') {
        // Our home category matches local high-household apartments as a placeholder
        if (prop.category !== '아파트') return false;
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
  }, [selectedCategory, activeSubPills, selectedTransaction, priceLimit, sizeRange, useYear, householdCount, searchQuery, favorites]);

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
            <nav className="hidden md:flex items-center gap-1.5" id="desktop-nav-menus">
              {[
                { name: '매물검색', id: 'listings-section' },
                { name: '분양권', id: 'listings-section' },
                { name: '공장/토지', id: 'listings-section' },
                { name: '오시는길', id: 'map-section' }
              ].map((menu) => {
                const isSelected = activeTab === menu.name;
                return (
                  <button
                    key={menu.name}
                    onClick={() => handleNavClick(menu.name as any, menu.id)}
                    className={`relative px-4 py-2 rounded-xl text-sm font-extrabold tracking-tight transition-all duration-200 cursor-pointer ${
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

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('아파트・오피스텔');
                      handleNavClick('매물검색', 'listings-section');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm ${
                      activeTab === '매물검색' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    매물검색
                  </button>
                  <button
                    onClick={() => {
                      applyPresetFilter('분양권', '전체');
                      setActiveTab('분양권');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm ${
                      activeTab === '분양권' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    분양권
                  </button>
                  <button
                    onClick={() => {
                      applyPresetFilter('공장/토지', '전체');
                      setActiveTab('공장/토지');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm ${
                      activeTab === '공장/토지' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    공장/토지
                  </button>
                  <button
                    onClick={() => {
                      handleNavClick('오시는길', 'map-section');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm ${
                      activeTab === '오시는길' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    오시는길
                  </button>
                </div>
              </div>

              <div className="mt-auto border-t border-amber-100 pt-6">
                <div className="bg-amber-50/50 backdrop-blur-xs p-4 rounded-xl border border-amber-100/55">
                  <p className="text-xs font-bold text-slate-800 mb-1">부강 대표 연락처</p>
                  <a href="tel:051-897-8900" className="text-sm font-bold text-amber-600 block mb-3 hover:underline">
                    051-897-8900
                  </a>
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
              <div className="flex flex-wrap items-center gap-1.5 border-b border-amber-150/40 pb-3" id="naver-main-categories">
                {[
                  { label: '아파트・오피', value: '아파트・오피스텔' },
                  { label: '분양권', value: '분양권' },
                  { label: '공장・토지', value: '공장・토지' },
                  { label: '상가・사무실', value: '상가・사무실' },
                  { label: '우리집 시세', value: '우리집' },
                  { label: '관심 매물 ♥', value: 'MY관심' }
                ].map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value as FilterCategory);
                      // Auto-init subpills
                      if (cat.value === '아파트・오피스텔') {
                        setActiveSubPills(['아파트', '오피스텔']);
                      } else if (cat.value === '분양권') {
                        setActiveSubPills(['분양권']);
                      } else if (cat.value === '공장・토지') {
                        setActiveSubPills(['공장/토지']);
                      } else if (cat.value === '상가・사무실') {
                        setActiveSubPills(['상가/사무실']);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === cat.value
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-100/60 text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                    }`}
                  >
                    {cat.label}
                    {cat.value === 'MY관심' && favorites.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sub-Pills Selector (Visible ONLY for 아파트・오피스텔 Category) */}
              <AnimatePresence>
                {selectedCategory === '아파트・오피스텔' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap items-center gap-1.5 bg-amber-50/40 p-2 rounded-xl border border-amber-100/50"
                  >
                    {[
                      { l: '아파트 단지', v: '아파트' },
                      { l: '오피스텔', v: '오피스텔' }
                    ].map(sub => {
                      const isActive = activeSubPills.includes(sub.v);
                      return (
                        <button
                          key={sub.v}
                          onClick={() => toggleSubPill(sub.v)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-amber-100 border border-amber-300 text-amber-800' 
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="mr-1">{isActive ? '✓' : '+'}</span>
                          {sub.l}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* Guidance alerts when select specific categories */}
              {selectedCategory === 'MY관심' && (
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 text-xs text-amber-800 font-bold leading-relaxed">
                  💡 매물 목록 카드 우측 상단이나 상세에서 하트(♥) 버튼을 선택해 저장한 관심 매물만을 수시 확인하실 수 있습니다.
                </div>
              )}
              {selectedCategory === '우리집' && (
                <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-xs text-amber-850 font-bold leading-relaxed">
                  🏡 보유하고 계신 부강 지역 아파트/주택 단지 시세를 부강 공인 대표가 맞춤 대조하여 직접 상담 및 중개 처리를 안전하게 도와드립니다.
                </div>
              )}

              {/* Reset active filtering controllers */}
              {(selectedCategory !== '아파트・오피스텔' || selectedTransaction !== '전체' || priceLimit !== '전체' || sizeRange !== '전체' || useYear !== '전체' || householdCount !== '전체' || searchQuery !== '') && (
                <div className="flex justify-between items-center pt-2.5 border-t border-amber-100 text-xs">
                  <span className="text-slate-400 font-extrabold">네이버 부동산 스타일의 필터링이 가동 중입니다.</span>
                  <button 
                    onClick={() => {
                      setSelectedCategory('아파트・오피스텔');
                      setActiveSubPills(['아파트', '오피스텔']);
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
            onClick={() => applyPresetFilter('아파트', '전세')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            아파트 전세
          </button>
          <button 
            onClick={() => applyPresetFilter('오피스텔', '월세')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            역세권 오피스텔 월세
          </button>
          <button 
            onClick={() => applyPresetFilter('분양권', '전체')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            양정 신축 분양권
          </button>
          <button 
            onClick={() => applyPresetFilter('공장/토지', '전체')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 font-black tracking-tight transition-all cursor-pointer shadow-xs border border-amber-200/60"
          >
            공장/토지 개발매물
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
            
            {/* Title / Info row */}
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedCategory} 매물 목록
                </span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2 py-0.5 rounded-full">
                  실시간 {filteredProperties.length}개 발견
                </span>
              </div>
              <div className="text-xs text-slate-400 font-bold">
                정밀 시세 데이터 연동 완료
              </div>
            </div>

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
                    setSelectedCategory('아파트・오피스텔');
                    setActiveSubPills(['아파트', '오피스텔']);
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

            {/* Results Listings Grid (2 Column standard, responsive) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      <div className="relative">
                        {/* Property Image & Hover scale */}
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
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

                          {/* Dynamic transaction Category badge */}
                          <div className="absolute left-3.5 bottom-3.5 flex flex-col gap-1 items-start">
                            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {prop.category}
                            </span>
                            <span className="text-white text-base sm:text-lg font-black tracking-tight drop-shadow-sm/85">
                              {prop.transactionType} {prop.priceText}
                            </span>
                          </div>
                        </div>

                        {/* Card Contents */}
                        <div className="p-4 sm:p-5">
                          {/* Tags block */}
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {prop.tags.map((tag) => (
                              <span key={tag} className="bg-amber-100/50 text-amber-900 border border-amber-200/30 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors tracking-tight">
                            {prop.name}
                          </h3>

                          {/* Detail Grid values */}
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-slate-50 pt-3 text-xs text-slate-500 font-semibold mb-3">
                            <div className="flex items-center gap-1.5 uppercase">
                              <span className="text-[10px] font-black text-amber-500">■</span>
                              <span>면적(평형): <strong className="text-slate-800">{prop.pyongValue}평</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-amber-500">■</span>
                              <span>연식: <strong className="text-slate-800">{prop.useYearValue}년</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-amber-500">■</span>
                              <span>층수/방향: <strong className="text-slate-800">{prop.floorText.split('/')[0]} / {prop.direction}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-amber-500">■</span>
                              <span>동호수 세대수: <strong className="text-slate-800">{prop.householdsCount > 0 ? `${prop.householdsCount}세대` : '단독형'}</strong></span>
                            </div>
                          </div>

                          {/* Address Info */}
                          <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            <span>{prop.location}</span>
                          </p>
                        </div>
                      </div>

                      {/* Detail triggers buttons */}
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-50 flex items-center gap-2 mt-auto">
                        <button
                          onClick={() => openDetailsAndSetInquiry(prop)}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2.5 rounded-xl text-center flex items-center justify-center gap-1 group/btn cursor-pointer shadow-xs transition-colors"
                        >
                          <span>상세설명 및 상담</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>

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
              <div className="w-full h-[400px] rounded-2xl overflow-hidden relative border border-slate-105 shadow-inner mt-11">
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
                    매물 공부상 상세 수치 개요
                  </span>
                  
                  <div className="grid grid-cols-2 gap-px bg-slate-200 p-px rounded-xl overflow-hidden">
                    {[
                      { key: '물건종류 및 명칭', val: selectedProperty.category },
                      { key: '전용면적 및 평수', val: `${selectedProperty.pyongValue}평형 (협의가능)` },
                      { key: '사용승인일(준공년도)', val: selectedProperty.useYearText },
                      { key: '주요 방향 구조', val: `${selectedProperty.direction} / 철근콘크리트` },
                      { key: '입지 소재지', val: selectedProperty.location },
                      { key: '배후 세대 인프라', val: selectedProperty.householdsCount > 0 ? `${selectedProperty.householdsCount}세대 대형빌리지` : '개별인접단독지' }
                    ].map((row, rIdx) => (
                      <React.Fragment key={rIdx}>
                        <div className="bg-slate-50 p-3 text-slate-500 font-bold block">{row.key}</div>
                        <div className="bg-white p-3 text-slate-800 font-black truncate block">{row.val}</div>
                      </React.Fragment>
                    ))}
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
              <footer className="p-4 sm:p-5 border-t border-amber-100 flex items-center gap-2.5 bg-slate-50">
                <button
                  onClick={() => {
                    setSelectedProperty(null);
                    const el = document.getElementById('inquiry-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-center cursor-pointer transition-colors"
                >
                  이 매물 가동 즉시 상담 신청 작성
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
              <li><button onClick={() => applyPresetFilter('아파트', '전체')} className="hover:text-amber-400 text-left">개금동 / 양정동 대단지 아파트</button></li>
              <li><button onClick={() => applyPresetFilter('오피스텔', '전체')} className="hover:text-amber-400 text-left">초역세권 서면 아파텔/오피스텔</button></li>
              <li><button onClick={() => applyPresetFilter('분양권', '전체')} className="hover:text-amber-400 text-left">재개발/재건축 고층 브랜드 분양권</button></li>
              <li><button onClick={() => applyPresetFilter('공장/토지', '전체')} className="hover:text-amber-400 text-left">당감동/사상지역 공업 준공업지 대지</button></li>
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
