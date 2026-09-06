export const PALETTE = [
  { name: 'Песчаник / Беж', color: '#D2C4B3' },
  { name: 'Баварский кирпич', color: '#8C4333' },
  { name: 'Светло-серый штукатур', color: '#B3B7B8' },
  { name: 'Темный клинкер', color: '#4A3B32' },
  { name: 'Оливковый фасад', color: '#555B4C' },
  { name: 'Антрацит', color: '#2C3539' }
];

export const TEXTURE_TYPES = [
  { id: 'amk', label: 'АМК фасад' },
  { id: 'brick', label: 'Кирпич' },
  { id: 'stucco', label: 'Штукатурка' },
  { id: 'wood', label: 'Дерево' },
  { id: 'horizontal', label: 'Горизонт. панели' },
  { id: 'vertical', label: 'Вертикал. панели' }
];

export const PARTITION_MATERIALS = [
  { id: 'drywall', label: 'Гипсокартон (ГКЛ)' },
  { id: 'gasblock', label: 'Газобетонный блок' },
  { id: 'brick', label: 'Перегородочный кирпич' },
  { id: 'pzg', label: 'Пазогребневая плита' }
];

export const VERANDA_MATERIALS = [
  { id: 'wood_light', label: 'Светлое дерево' },
  { id: 'wood_dark', label: 'Мореный дуб' },
  { id: 'wpc', label: 'ДПК Композит' },
  { id: 'metal', label: 'Металлокаркас' }
];

export const FENCE_STYLES = [
  { id: 'cross', label: 'Крестообразный' },
  { id: 'vertical', label: 'Решетка' },
  { id: 'glass', label: 'Стекло' },
  { id: 'none', label: 'Без забора' }
];

export interface AMKColorPreset {
  id: string;
  name: string;
  colors: [string, string, string]; // [Основной, Второстепенный/Акцент, Цвет шва]
}

export const AMK_TEXTURE_PRESETS: AMKColorPreset[] = [
  // Монохромные / Светлые
  { id: '001', name: '001 Светло-серый', colors: ['#E6E4E0', '#D3D0C9', '#A3A09A'] },
  { id: '002', name: '002 Серый', colors: ['#A0A4A8', '#8A8E92', '#5A5E62'] },
  { id: '010', name: '010 Чёрный', colors: ['#232528', '#181A1C', '#000000'] },

  // Песчаные / Бежевые
  { id: '100', name: '100 Песочный MIX', colors: ['#C69363', '#A87448', '#DDAD7C'] },
  { id: '101', name: '101 Бежевый светлый', colors: ['#D6A77A', '#C39366', '#E9BC91'] },
  { id: '102', name: '102 Бежевый', colors: ['#B88256', '#9E6C43', '#D0996D'] },
  { id: '103', name: '103 Бежевый тёмный', colors: ['#8A5936', '#704323', '#A46F4A'] },

  // Серые / Графит
  { id: '200', name: '200 Серый MIX', colors: ['#798086', '#595F65', '#9BA2A8'] },
  { id: '201', name: '201 Серый светлый', colors: ['#92989E', '#7A8086', '#AFB5BB'] },
  { id: '202', name: '202 Серый', colors: ['#696F75', '#52585E', '#848A90'] },
  { id: '203', name: '203 Серый тёмный', colors: ['#474D53', '#32373C', '#60666C'] },
  { id: '204', name: '204 Графит', colors: ['#31353A', '#202327', '#484E54'] },
  { id: '241', name: '241 Графит MIX', colors: ['#383D42', '#1E2124', '#555C63'] },

  // Коричневые / Шоколад
  { id: '300', name: '300 Коричневый MIX', colors: ['#5C3D2E', '#42291D', '#785341'] },
  { id: '301', name: '301 Коричневый светлый', colors: ['#7A4F3A', '#603B28', '#94654F'] },
  { id: '302', name: '302 Коричневый', colors: ['#5E3725', '#462415', '#784C37'] },
  { id: '303', name: '303 Коричневый тёмный', colors: ['#422215', '#2B1309', '#5B3322'] },
  { id: '322', name: '322 Темный Шоколад MIX', colors: ['#3A241B', '#23130C', '#54372A'] },

  // Красные / Терракот / Клинкер
  { id: '401', name: '401 Красный светлый', colors: ['#A04338', '#853228', '#BC574B'] },
  { id: '402', name: '402 Красный', colors: ['#862F25', '#6D2017', '#A04136'] },
  { id: '403', name: '403 Красный тёмный', colors: ['#681E16', '#4E110A', '#832E25'] },
  { id: '404', name: '404 Рубин', colors: ['#4F120E', '#360906', '#691B16'] },
  { id: '410', name: '410 Баварский MIX', colors: ['#883429', '#4D1B15', '#A6483C'] },
  { id: '432', name: '432 Клинкер MIX', colors: ['#7B2D24', '#38221B', '#9B4136'] },

  // Оранжевые / Кирпич
  { id: '500', name: '500 Оранжевый MIX', colors: ['#D15B28', '#B04417', '#E77441'] },
  { id: '501', name: '501 Оранжевый светлый', colors: ['#E06B33', '#C4521D', '#F2834D'] },
  { id: '502', name: '502 Оранжевый', colors: ['#C8511D', '#A93B0A', '#DE6833'] },
  { id: '503', name: '503 Оранжевый тёмный', colors: ['#A43A0F', '#852904', '#BD4F22'] }
];