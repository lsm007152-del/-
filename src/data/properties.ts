export interface Property {
  id: string;
  type: '아파트' | '오피스텔' | '원룸' | '분양권' | '공장' | '토지';
  name: string;
  transactionType: '매매' | '전세' | '월세';
  priceDisplay: string;
  priceValue: number; // 단위: 만원 (예: 5억 2천 = 52000, 4500 = 4500)
  depositValue?: number; // 월세 보증금 단위: 만원
  rentValue?: number; // 월세 단위: 만원
  pyung: number; // 평수 (예: 34)
  sizeM2: number; // m² (예: 112)
  floor: string; // 층수
  direction: string; // 방향 (남향, 남서향 등)
  address: string; // 주소 및 위치 설명
  description: string; // 상세 설명 text
  image: string; // 이미지 URL
  features: string[]; // 태그 리스트
  agentName: string;
  agentPhone: string;
}

export const propertyData: Property[] = [
  {
    id: 'prop-1',
    type: '아파트',
    name: '양정자이더샵SKVIEW 대단지',
    transactionType: '매매',
    priceDisplay: '매매 7억 5,000',
    priceValue: 75000,
    pyung: 34,
    sizeM2: 113,
    floor: '18층/34층',
    direction: '남향',
    address: '부산광역시 부산진구 양정동 73-7',
    description: '초역세권 대단지 신축 아파트입니다. 채광이 매우 훌륭한 남향 판상형 구조이며, 단지 내 조경 및 명품 하이엔드 커뮤니티 시설이 완비되어 있습니다. 학군과 생활 인프라가 뛰어납니다.',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    features: ['신축급', '역세권', '남향 판상형', '커뮤니티우수'],
    agentName: '고민주 대표',
    agentPhone: '051-897-8900'
  },
  {
    id: 'prop-2',
    type: '아파트',
    name: '서면아이파크 1단지 로얄동',
    transactionType: '전세',
    priceDisplay: '전세 3억 8,000',
    priceValue: 38000,
    pyung: 25,
    sizeM2: 84,
    floor: '12층/29층',
    direction: '남서향',
    address: '부산광역시 부산진구 전포동 340-9',
    description: '서면 중심가와 전포카페거리가 인접하여 인프라가 매우 편리한 브랜드 대단지 아파트입니다. 올수리 상태로 즉시 입주 가능하며 내부 가전 옵션 조율 가능합니다. 신혼부부에게 강력 추천하는 매물입니다.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    features: ['즉시입주', '올수리', '조망권수선', '스타일러옵션'],
    agentName: '고민주 대표',
    agentPhone: '051-897-8900'
  },
  {
    id: 'prop-3',
    type: '오피스텔',
    name: '서면 삼정코아더시티 복층',
    transactionType: '월세',
    priceDisplay: '월세 1,000 / 65',
    priceValue: 65, // 월세금액 기준 정렬용
    depositValue: 1000,
    rentValue: 65,
    pyung: 12,
    sizeM2: 42,
    floor: '15층/22층',
    direction: '동향',
    address: '부산광역시 부산진구 부전동 534-2',
    description: '층고가 높아 개방감이 뛰어난 복층형 오피스텔입니다. 냉장고, 드럼세탁기, 시스템 에어컨, 붙박이장 풀옵션 세련된 인테리어. 빌트인 수납공간이 극대화되어 공간 활용에 매우 좋습니다. 서면역 도보 5분 거리.',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80',
    features: ['풀옵션', '복층구조', '서면역 도보5분', '보증금 조율가능'],
    agentName: '고민주 대표',
    agentPhone: '051-897-8900'
  },
  {
    id: 'prop-4',
    type: '분양권',
    name: '범천 한라비발디 센트로 분양권',
    transactionType: '매매',
    priceDisplay: '매매 5억 1,000 (P 2,000)',
    priceValue: 51000,
    pyung: 30,
    sizeM2: 99,
    floor: '高층/29층',
    direction: '남동향',
    address: '부산광역시 부산진구 범천동 850-1',
    description: '범천동 재개발 촉진지구 인근 대규모 호재 수혜지. 한라비발디 센트로 아파트 분양권 매매입니다. 프리미엄 소액 조정 및 조율 가능하며, 범천철도차량기지 이전 완료 시 미래 가치 상승 최고 유망 단지.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    features: ['분양권', '철도차량기지 호재', '로얄층', 'P협상가능'],
    agentName: '고민주 대표',
    agentPhone: '051-897-8900'
  },
  {
    id: 'prop-5',
    type: '원룸',
    name: '개금역 초역세권 신축 원룸',
    transactionType: '월세',
    priceDisplay: '월세 500 / 45',
    priceValue: 45,
    depositValue: 500,
    rentValue: 45,
    pyung: 7,
    sizeM2: 24,
    floor: '4층/8층',
    direction: '남향',
    address: '부산광역시 부산진구 개금동 177-3',
    description: '개금역 도보 2분 거리에 위치한 신축 풀옵션 원룸입니다. 중문 설치로 방음 및 냉난방 효율이 매우 뛰어나며 주차난 걱정 없는 지하 주차 공간을 활용할 수 있습니다. 즉시 입주 및 입주 시기 완벽 조정 가능합니다.',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    features: ['신축원룸', '초역세권', '중문설치', '풀옵션'],
    agentName: '고민주 대표',
    agentPhone: '051-897-8900'
  },
  {
    id: 'prop-6',
    type: '공장',
    name: '가야동 공장 겸 창고용 부지',
    transactionType: '매매',
    priceDisplay: '매매 12억 5,000',
    priceValue: 125000,
    pyung: 85,
    sizeM2: 280,
    floor: '단층',
    direction: '북동향',
    address: '부산광역시 부산진구 가야동 283',
    description: '도로 폭이 넓어 대형 차량 및 탑차 진출입이 수월한 공장 겸 창고입니다. 층고가 7m로 매우 높고 호이스트 설치 가능. 보일러 및 간단한 사무 공간이 내부에 구성되어 있어 다용도 목적 업종에 추천합니다.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    features: ['대형차량진입', '창고겸용', '층고7m', '전력공급구비'],
    agentName: '고민주 대표',
    agentPhone: '051-897-8900'
  },
  {
    id: 'prop-7',
    type: '토지',
    name: '당감동 주택 및 상가 건축용 나대지',
    transactionType: '매매',
    priceDisplay: '매매 9억 3,000',
    priceValue: 93000,
    pyung: 62,
    sizeM2: 205,
    floor: '해당없음',
    direction: '남동향',
    address: '부산광역시 부산진구 당감동 402-1',
    description: '당감시장 초입 사거리 코너변에 위치하여 상가주택이나 빌딩, 꼬마빌딩 건축용지로 최고의 입지입니다. 명도 절차 및 서류 확보 완료로 즉시 소유권 이전 및 연내 착공 가능합니다. 높은 미래 가치의 투자 목적 강추.',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    features: ['코너사거리', '상축/신축용지', '명도완료', '투자가치'],
    agentName: '고민주 대표',
    agentPhone: '051-897-8900'
  },
  {
    id: 'prop-8',
    type: '아파트',
    name: '서면 삼한골든뷰센트럴파크',
    transactionType: '전세',
    priceDisplay: '전세 4억 5,000',
    priceValue: 45000,
    pyung: 34,
    sizeM2: 112,
    floor: '32층/58층',
    direction: '남서향',
    address: '부산광역시 부산진구 범전동 383',
    description: '송상현광장과 시민공원을 영구 조망할 수 있는 우수한 프리미엄 랜드마크 초고층 주상복합 아파트입니다. 정남향에 가까우며 채광 및 환기가 압도적입니다. 고층부 세대로 환상적인 야경을 선사합니다.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    features: ['시민공원뷰', '초고층랜드마크', '남향위주', '융자무위험'],
    agentName: '고민주 대표',
    agentPhone: '051-897-8900'
  }
];
