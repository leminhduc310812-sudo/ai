import { PracticeItem } from '../types';

export const PRACTICE_CATEGORIES = [
  { id: 'ending_sounds', label: 'Âm Đuôi (Ending Sounds)', icon: 'Sparkles', desc: 'Khắc phục lỗi nuốt phụ âm cuối /t/, /d/, /s/, /z/, /tʃ/' },
  { id: 'minimal_pairs', label: 'Cặp Âm Dễ Nhầm (Minimal Pairs)', icon: 'Layers', desc: 'Phân biệt chính xác /θ/ - /s/, /iː/ - /ɪ/, /l/ - /r/' },
  { id: 'word_stress', label: 'Trọng Âm Từ (Word Stress)', icon: 'Activity', desc: 'Quy tắc nhấn đúng âm tiết, ngữ điệu tự nhiên' },
  { id: 'connected_speech', label: 'Nối Âm & Ngữ Điệu (Connected Speech)', icon: 'Mic2', desc: 'Luyện nối từ, nuốt âm nhẹ và nhịp điệu bản xứ' },
  { id: 'business_daily', label: 'Giao Tiếp & Công Sở (Daily & Work)', icon: 'Briefcase', desc: 'Mẫu câu thực tế khi thuyết trình và hội thoại' },
] as const;

export const INITIAL_PRACTICE_ITEMS: PracticeItem[] = [
  {
    id: 'end-01',
    category: 'ending_sounds',
    level: 'beginner',
    text: 'Thought',
    ipa: '/θɔːt/',
    translation: 'Suy nghĩ / Ý nghĩ',
    focusSound: '/θ/ & âm cuối /t/',
    tip: 'Đặt đầu lưỡi giữa 2 hàm răng cho âm /θ/, sau đó bật nhẹ âm /t/ ở cuối từ, không nuốt âm đuôi.',
    exampleSentence: 'I thought about it all day.'
  },
  {
    id: 'end-02',
    category: 'ending_sounds',
    level: 'beginner',
    text: 'World',
    ipa: '/wɜːrld/',
    translation: 'Thế giới',
    focusSound: '/rld/ ending cluster',
    tip: 'Cuộn lưỡi cho /r/, chạm đầu lưỡi lên vòm họng cho /l/ rồi bật nhẹ /d/.',
    exampleSentence: 'Travel around the world.'
  },
  {
    id: 'end-03',
    category: 'ending_sounds',
    level: 'intermediate',
    text: 'Comfortable',
    ipa: '/ˈkʌmf.tə.bəl/',
    translation: 'Thoải mái',
    focusSound: 'Rút gọn 3 âm tiết & /bəl/ cuối',
    tip: 'Lưu ý người bản xứ thường phát âm 3 âm tiết "COMF-tuh-bul", không đọc thành 4 âm tiết.',
    exampleSentence: 'Make yourself comfortable.'
  },
  {
    id: 'min-01',
    category: 'minimal_pairs',
    level: 'beginner',
    text: 'Think vs Sink',
    ipa: '/θɪŋk/ vs /sɪŋk/',
    translation: 'Nghĩ vs Chìm',
    focusSound: '/θ/ vs /s/',
    tip: '/θ/: Lưỡi đưa ra giữa hai hàm răng, thổi hơi. /s/: Răng khép lại, lưỡi nằm sau răng dưới.',
    exampleSentence: 'I think the ship will sink.'
  },
  {
    id: 'min-02',
    category: 'minimal_pairs',
    level: 'intermediate',
    text: 'Sheet vs Sit',
    ipa: '/ʃiːt/ vs /sɪt/',
    translation: 'Khăn trải/Tờ giấy vs Ngồi',
    focusSound: '/iː/ dài vs /ɪ/ ngắn & /ʃ/ vs /s/',
    tip: 'Kéo khóe miệng sang hai bên như đang cười cho âm /iː/, còn /ɪ/ thả lỏng quai hàm và phát âm dứt khoát.',
    exampleSentence: 'Take a seat on the clean sheet.'
  },
  {
    id: 'stress-01',
    category: 'word_stress',
    level: 'intermediate',
    text: 'Photograph vs Photographer',
    ipa: '/ˈfəʊ.tə.ɡrɑːf/ vs /fəˈtɒɡ.rə.fər/',
    translation: 'Bức ảnh vs Nhiếp ảnh gia',
    focusSound: 'Chuyển dịch trọng âm',
    tip: 'Photograph nhấn âm 1: PHO-to-graph. Photographer chuyển sang nhấn âm 2: pho-TO-gra-pher.',
    exampleSentence: 'The photographer took an award-winning photograph.'
  },
  {
    id: 'stress-02',
    category: 'word_stress',
    level: 'advanced',
    text: 'Particularly',
    ipa: '/pəˈtɪk.jə.lə.li/',
    translation: 'Đặc biệt là',
    focusSound: 'Trọng âm âm 2 & lướt âm Schwa /ə/',
    tip: 'Nhấn mạnh rõ rệt vào âm /tɪk/, các âm còn lại hạ giọng và lướt nhẹ nhàng.',
    exampleSentence: 'It is particularly important today.'
  },
  {
    id: 'conn-01',
    category: 'connected_speech',
    level: 'intermediate',
    text: 'What do you want to do?',
    ipa: '/wʌt də jə wɒnə duː/',
    translation: 'Bạn muốn làm gì?',
    focusSound: 'Nối âm & giản lược "wanna"',
    tip: 'Trong hội thoại tự nhiên, cụm từ lướt thành "Whaddya wanna do?" với ngữ điệu đi xuống ở cuối câu.',
    exampleSentence: 'What do you want to do this weekend?'
  },
  {
    id: 'conn-02',
    category: 'connected_speech',
    level: 'advanced',
    text: 'Could you help me out?',
    ipa: '/kʊdʒuː help miː aʊt/',
    translation: 'Bạn có thể giúp tôi một chút không?',
    focusSound: 'Đồng hóa âm /d/ + /j/ -> /dʒ/',
    tip: 'Âm /d/ ở cuối "could" gặp /j/ ở đầu "you" tạo thành âm /dʒ/ ("Could-jew").',
    exampleSentence: 'Could you help me out with this report?'
  },
  {
    id: 'biz-01',
    category: 'business_daily',
    level: 'intermediate',
    text: 'Let me double-check that for you.',
    ipa: '/let miː ˈdʌb.əl tʃek ðæt fər juː/',
    translation: 'Để tôi kiểm tra kỹ lại giúp bạn.',
    focusSound: 'Âm /tʃ/ trong check & /ð/ trong that',
    tip: 'Bật dứt khoát âm /tʃ/, lưỡi đưa nhẹ khi đọc "that", giữ nhịp tự tin, lịch sự.',
    exampleSentence: 'Let me double-check that schedule for you.'
  }
];
