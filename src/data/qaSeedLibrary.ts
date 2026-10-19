import { QaSeedItem } from '../types';

export const INITIAL_QA_SEEDS: QaSeedItem[] = [
  // =========================================================================
  // CHỦ ĐỀ: Tiếng Anh Lớp 10 (Global Success) - subj-1
  // =========================================================================
  {
    id: 'qa-eng-1',
    subjectId: 'subj-1',
    question: 'Làm sao để nhớ cách phát âm đuôi -ed mà không bị nhầm lẫn giữa /t/, /d/ và /ɪd/?',
    shortAnswer: 'Chỉ cần nhớ 2 nhóm đặc biệt: 1) Đọc là /ɪd/ khi tận cùng là t hoặc d (wanted, needed); 2) Đọc là /t/ sau các âm vô thanh như p, k, f, s, sh, ch (helped, washed). Tất cả các trường hợp còn lại đều đọc là /d/ (played, cleaned).',
    category: 'ngu_am',
    categoryLabel: 'Ngữ âm & Phát âm',
    exampleNote: 'Mẹo nhớ nhóm /t/: "Thôi không phiền sếp sợ chó".',
    suggestedPrompt: 'Cho em 5 câu bài tập trắc nghiệm phát âm đuôi -ed có giải thích chi tiết nhé!',
    isFavorite: true,
  },
  {
    id: 'qa-eng-2',
    subjectId: 'subj-1',
    question: 'Tại sao trong bài đọc Unit 3, từ "orchestra" có chữ "ch" nhưng lại phát âm là /k/?',
    shortAnswer: 'Vì từ "orchestra" bắt nguồn từ tiếng Hy Lạp cổ. Hầu hết các từ gốc Hy Lạp có cụm "ch" đều được phát âm là /k/ thay vì /tʃ/, tương tự như: school, chemistry, stomach, echo hay mechanic.',
    category: 'tu_vung',
    categoryLabel: 'Từ vựng & Ngữ nguyên',
    exampleNote: 'Phiên âm chuẩn: orchestra /ˈɔː.kɪ.strə/ - nhấn trọng âm ở âm tiết đầu.',
    suggestedPrompt: 'Liệt kê các từ tiếng Anh có "ch" phát âm là /k/ thường gặp trong đề thi lớp 10.',
    isFavorite: true,
  },
  {
    id: 'qa-eng-3',
    subjectId: 'subj-1',
    question: 'Khi nào nên dùng Thì Hiện Tại Hoàn Thành (have done) thay vì Quá Khứ Đơn (did)?',
    shortAnswer: 'Dùng Quá Khứ Đơn khi hành động đã xong hẳn và có thời gian xác định (yesterday, last year, in 2020). Dùng Hiện Tại Hoàn Thành khi hành động xảy ra nhưng không rõ thời gian, hoặc vẫn kéo dài / để lại kết quả ở hiện tại (since, for, already, yet).',
    category: 'ngu_phap',
    categoryLabel: 'Ngữ pháp cốt lõi',
    exampleNote: '"I lost my key yesterday" (hôm qua mất) vs "I have lost my key" (bây giờ vẫn chưa tìm thấy).',
    suggestedPrompt: 'Phân tích sự khác biệt giữa "have gone to" và "have been to" với ví dụ.',
    isFavorite: false,
  },
  {
    id: 'qa-eng-4',
    subjectId: 'subj-1',
    question: 'Em hay bị tật nuốt âm đuôi /t/, /d/, /s/ khi nói câu dài thì khắc phục thế nào?',
    shortAnswer: 'Hãy nói chậm lại nửa nhịp (tốc độ 0.8x), tập trung chạm nhẹ đầu lưỡi vào chân răng cửa trên khi từ kết thúc bằng /t/ hoặc /d/. Luyện từng cặp từ tối thiểu như wife - white - wine trước khi ghép vào cả câu.',
    category: 'meo_ghi_nho',
    categoryLabel: 'Mẹo ôn luyện phát âm',
    exampleNote: 'Luyện câu: "I need to check the price." Chú ý bật âm /k/ trong check và /s/ trong price.',
    suggestedPrompt: 'Hướng dẫn em bài tập khẩu hình miệng để phát âm âm đuôi dứt khoát hơn.',
    isFavorite: true,
  },
  {
    id: 'qa-eng-5',
    subjectId: 'subj-1',
    question: 'Từ "rhythm" (nhịp điệu) trong Unit 3 phát âm thế nào và có gì đặc biệt?',
    shortAnswer: 'Phiên âm là /ˈrɪð.əm/. Điểm đặc biệt là từ này không có nguyên âm chính thức (a, e, i, o, u) mà dùng chữ "y" làm nguyên âm ngắn /ɪ/, và âm đuôi là /ð/ có rung lưỡi kèm âm /m/ khép môi.',
    category: 'ngu_am',
    categoryLabel: 'Ngữ âm & Phát âm',
    exampleNote: 'Nhiều bạn hay đọc nhầm thành "ry-them". Đúng là /ˈrɪð.əm/.',
    suggestedPrompt: 'Tập phát âm từ rhythm cùng câu ví dụ trong Unit 3 SGK.',
    isFavorite: false,
  },

  // =========================================================================
  // CHỦ ĐỀ: Giao Tiếp & Phản Xạ Hàng Ngày - subj-2
  // =========================================================================
  {
    id: 'qa-com-1',
    subjectId: 'subj-2',
    question: 'Nói câu nhờ vả hoặc hỏi đường thế nào cho lịch sự thay vì nói cộc lốc "Help me"?',
    shortAnswer: 'Người bản xứ luôn dùng mẫu câu gián tiếp lịch sự: "Could you please give me a hand with...?" (Bạn có thể giúp tôi một tay với...?) hoặc "Would you mind showing me the way to...?" (Phiền bạn chỉ đường giúp tôi đến...?).',
    category: 'van_dung',
    categoryLabel: 'Giao tiếp thực tế',
    exampleNote: 'Thêm chữ "please" ở cuối câu và lên giọng nhẹ để tăng độ thân thiện.',
    suggestedPrompt: 'Cung cấp 5 mẫu câu nhờ vả lịch sự bằng tiếng Anh trong khách sạn và sân bay.',
    isFavorite: true,
  },
  {
    id: 'qa-com-2',
    subjectId: 'subj-2',
    question: 'Khi người nước ngoài hỏi "How are you doing?", trả lời sao cho tự nhiên ngoài câu "I am fine"?',
    shortAnswer: 'Bạn có thể trả lời tự nhiên: "I am doing well, thank you!", "Pretty good, how about you?", hoặc "Not too bad, thanks!". Đây là các cách đáp lại đời thường mà người bản ngữ dùng hằng ngày.',
    category: 'van_dung',
    categoryLabel: 'Giao tiếp thực tế',
    exampleNote: 'Hạn chế nói mỗi "I am fine, thank you, and you?" vì nghe rất giống học vẹt trong sách cũ.',
    suggestedPrompt: 'Những câu chào hỏi và phản xạ tự nhiên khi gặp người bản xứ lần đầu.',
    isFavorite: false,
  },
  {
    id: 'qa-com-3',
    subjectId: 'subj-2',
    question: 'Làm sao để đặt phòng khách sạn (check-in) bằng tiếng Anh trôi chảy và đúng thủ tục?',
    shortAnswer: 'Bạn dùng mẫu: "Good morning, I have a reservation under the name of [Tên bạn]. Here is my passport and booking confirmation." Nếu muốn hỏi thêm dịch vụ, hỏi: "Is breakfast included in the room rate?".',
    category: 'van_dung',
    categoryLabel: 'Giao tiếp du lịch',
    exampleNote: 'Chuẩn bị sẵn giấy tờ hoặc mã đặt phòng trên điện thoại.',
    suggestedPrompt: 'Đóng vai lễ tân khách sạn và cùng em thực hành hội thoại check-in nhé!',
    isFavorite: true,
  },

  // =========================================================================
  // CHỦ ĐỀ: Luyện Phát Âm Chuyên Sâu (IPA & Âm Đuôi) - subj-3
  // =========================================================================
  {
    id: 'qa-ipa-1',
    subjectId: 'subj-3',
    question: 'Cặp âm khó /θ/ (think) và /ð/ (this) đặt vị trí lưỡi và thổi hơi như thế nào?',
    shortAnswer: 'Cả hai âm đều yêu cầu đặt nhẹ đầu lưỡi ở giữa hai hàm răng trên và dưới, không cắn chặt. /θ/ là âm vô thanh (chỉ có luồng hơi gió thổi qua khe răng). /ð/ là âm hữu thanh (dây thanh quản rung, phát ra âm thanh).',
    category: 'ngu_am',
    categoryLabel: 'Vị trí khẩu hình IPA',
    exampleNote: 'Không rụt lưỡi vào trong vòm họng vì sẽ bị biến thành âm /t/ hoặc /d/.',
    suggestedPrompt: 'Cho em 10 từ luyện tập phân biệt giữa /θ/ và /t/, /ð/ và /d/.',
    isFavorite: true,
  },
  {
    id: 'qa-ipa-2',
    subjectId: 'subj-3',
    question: 'Quy tắc xác định trọng âm của từ có 2 âm tiết là gì?',
    shortAnswer: 'Quy tắc chung: Đa số Danh từ và Tính từ 2 âm tiết nhấn trọng âm ở âm tiết thứ nhất (ví dụ: \'table, \'happy, \'culture). Đa số Động từ 2 âm tiết nhấn trọng âm ở âm tiết thứ hai (ví dụ: re\'lax, de\'cide, a\'rrive).',
    category: 'ngu_am',
    categoryLabel: 'Quy tắc trọng âm',
    exampleNote: 'Chú ý ngoại lệ: \'record (danh từ: bản ghi) vs re\'cord (động từ: ghi lại).',
    suggestedPrompt: 'Giải thích quy tắc đổi trọng âm khi một từ vừa là danh từ vừa là động từ.',
    isFavorite: false,
  },

  // =========================================================================
  // CHỦ ĐỀ: Bài Đọc Khoa Học & Đời Sống - subj-4
  // =========================================================================
  {
    id: 'qa-sci-1',
    subjectId: 'subj-4',
    question: 'Khi đọc bài báo khoa học tiếng Anh nhiều từ chuyên ngành, làm sao để không bị ngợp?',
    shortAnswer: 'Áp dụng kỹ thuật Skimming & Scanning: Đọc câu chủ đề đầu mỗi đoạn để nắm thông điệp lớn. Đoán nghĩa từ vựng chuyên ngành thông qua tiền tố / hậu tố (như bio- là sinh học, eco- là môi trường) thay vì dừng lại tra từ điển mọi từ mới.',
    category: 'meo_ghi_nho',
    categoryLabel: 'Kỹ năng đọc hiểu',
    exampleNote: 'Từ ghép: Biodiversity = Bio (sống) + Diversity (đa dạng) -> Đa dạng sinh học.',
    suggestedPrompt: 'Cho em bài đọc ngắn về môi trường đại dương kèm câu hỏi trắc nghiệm.',
    isFavorite: true,
  },
  {
    id: 'qa-sci-2',
    subjectId: 'subj-4',
    question: 'Từ "environment" và "ecosystem" khác nhau ở phạm vi khái niệm như thế nào?',
    shortAnswer: '"Environment" (Môi trường) là khái niệm bao quát chỉ tất cả các điều kiện tự nhiên (không khí, nước, đất, khí hậu) xung quanh ta. "Ecosystem" (Hệ sinh thái) cụ thể hơn, là một hệ thống tương tác qua lại giữa các sinh vật sống và môi trường vật lý của chúng trong một khu vực nhất định.',
    category: 'tu_vung',
    categoryLabel: 'Phân biệt thuật ngữ',
    exampleNote: 'Rừng ngập mặn là một "ecosystem", còn bầu khí quyển Trái Đất thuộc về "environment".',
    suggestedPrompt: 'Tóm tắt các từ vựng liên quan đến biến đổi khí hậu (Climate Change).',
    isFavorite: false,
  },
];
