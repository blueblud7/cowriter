export type Lang = 'kr' | 'en';

export interface Genre {
  id: string; swatch: string; icon: string;
  kr: { name: string; desc: string };
  en: { name: string; desc: string };
}

export interface Character {
  id: string; role: string; portraitId: string;
  name: string; age: number | null; oneLine: string;
  traits: string[]; voice: string; wants: string; fears: string; arc: string;
  relationships: { with: string; label: string }[];
}

export interface WorldPlace { id: string; name: string; note: string; }
export interface WorldObject { id: string; name: string; note: string; }
export interface World {
  places: WorldPlace[];
  objects: WorldObject[];
  backstory: string;
}

export interface Beat { id: string; title: string; pos: number; ch: number; desc: string; }

export interface Premise {
  genre: string; logline: string; themes: string[];
  tone: string; pov: string; tense: string; setting: string;
}
export type Level = 'kids' | 'beginner' | 'growing' | 'pro';
export type Palette = 'paper' | 'sunset' | 'sage' | 'twilight';
export type Typeset = 'manuscript' | 'editorial' | 'modern';
export type Route = 'auth' | 'onboarding' | 'dashboard' | 'editor' | 'diff' | 'analysis' | 'focus' | 'bible';
export type WritingCategory = 'fiction' | 'essay' | 'journal' | 'nonfiction' | 'poetry';

export interface WritingFormat {
  id: string; icon: string; category: WritingCategory; swatch: string;
  kr: { name: string; desc: string };
  en: { name: string; desc: string };
}

export const WRITING_FORMATS: WritingFormat[] = [
  // Fiction
  { id: 'novel_literary',  icon: '📖', category: 'fiction',   swatch: '#C8633D', kr: { name: '순문학',       desc: '심리 묘사와 문체의 깊이' },           en: { name: 'Literary Fiction', desc: 'Depth of prose and psychology' } },
  { id: 'novel_romance',   icon: '💕', category: 'fiction',   swatch: '#E05F8E', kr: { name: '로맨스',       desc: '감정의 기복과 두 인물의 화학' },       en: { name: 'Romance',          desc: 'Emotional tension and chemistry' } },
  { id: 'novel_thriller',  icon: '🔪', category: 'fiction',   swatch: '#2A2A3A', kr: { name: '스릴러',       desc: '긴장감과 반전의 속도전' },             en: { name: 'Thriller',         desc: 'Suspense, pace, and twists' } },
  { id: 'novel_fantasy',   icon: '🧙', category: 'fiction',   swatch: '#6B4DA0', kr: { name: '판타지',       desc: '세계관의 일관성과 영웅의 여정' },     en: { name: 'Fantasy',          desc: 'World-building and hero journey' } },
  { id: 'novel_scifi',     icon: '🚀', category: 'fiction',   swatch: '#2A6B8A', kr: { name: 'SF',           desc: '미래 상상과 기술-인간의 관계' },       en: { name: 'Sci-Fi',           desc: 'Future visions, tech vs humanity' } },
  { id: 'novel_horror',    icon: '👻', category: 'fiction',   swatch: '#5A1A1A', kr: { name: '호러',         desc: '공포의 점진적 구축과 심리 압박' },     en: { name: 'Horror',           desc: 'Dread, atmosphere, psychological fear' } },
  { id: 'novel_historical',icon: '🏛', category: 'fiction',   swatch: '#7A5A3A', kr: { name: '역사소설',     desc: '시대 배경의 진정성' },                 en: { name: 'Historical',       desc: 'Period authenticity and context' } },
  { id: 'fairy_tale',      icon: '🧚', category: 'fiction',   swatch: '#6B8E5A', kr: { name: '동화',         desc: '단순한 언어와 교훈, 마법의 세계' },   en: { name: 'Fairy Tale',       desc: 'Simple language, magic, moral' } },
  { id: 'ya_fiction',      icon: '🌱', category: 'fiction',   swatch: '#5A8A6B', kr: { name: '청소년 소설',  desc: '성장과 정체성, 첫 경험의 강렬함' },   en: { name: 'Young Adult',      desc: 'Coming-of-age and identity' } },
  // Essay
  { id: 'essay_personal',  icon: '✍', category: 'essay',     swatch: '#8A6F3D', kr: { name: '개인 에세이',  desc: '진솔한 경험에서 보편적 통찰로' },     en: { name: 'Personal Essay',   desc: 'Personal experience to universal truth' } },
  { id: 'essay_critical',  icon: '🔍', category: 'essay',     swatch: '#3D5A8A', kr: { name: '비평 에세이',  desc: '논리와 근거, 비판적 사고' },           en: { name: 'Critical Essay',   desc: 'Logic, argument, critical thinking' } },
  { id: 'essay_travel',    icon: '✈', category: 'essay',     swatch: '#3D8A7A', kr: { name: '여행기',       desc: '장소와 경험의 생생한 포착' },         en: { name: 'Travel Writing',   desc: 'Vivid capture of places and encounters' } },
  // Journal
  { id: 'journal',         icon: '📔', category: 'journal',   swatch: '#7A5A8A', kr: { name: '일기/저널',    desc: '솔직하고 자유로운 개인의 기록' },     en: { name: 'Journal',          desc: 'Honest, free personal record' } },
  { id: 'journal_reflection',icon:'🌙',category: 'journal',  swatch: '#4A5A8A', kr: { name: '성찰 일기',    desc: '깊은 자기 성찰과 내면의 탐구' },      en: { name: 'Reflective Journal',desc: 'Deep self-reflection and inner exploration' } },
  // Non-fiction
  { id: 'memoir',          icon: '🕰', category: 'nonfiction',swatch: '#8A5A3D', kr: { name: '회고록',       desc: '실제 경험으로 쓴 삶의 이야기' },      en: { name: 'Memoir',           desc: 'True story, memory, meaning-making' } },
  { id: 'article',         icon: '📰', category: 'nonfiction',swatch: '#3D3D5A', kr: { name: '기사/보도문',  desc: '사실 기반의 명료하고 객관적인 글' }, en: { name: 'Article / Report', desc: 'Fact-based, clear, objective' } },
  { id: 'bio',             icon: '👤', category: 'nonfiction',swatch: '#5A5A3D', kr: { name: '소개문',       desc: '아이덴티티와 경험의 스토리텔링' },    en: { name: 'Bio / Introduction',desc: 'Identity and experience as story' } },
  // Poetry
  { id: 'poetry',          icon: '🌙', category: 'poetry',    swatch: '#B5527A', kr: { name: '시',           desc: '압축된 이미지와 리듬, 여백의 언어' }, en: { name: 'Poetry',           desc: 'Compressed image, rhythm, silence' } },
  { id: 'prose_poetry',    icon: '🌿', category: 'poetry',    swatch: '#4A8A6B', kr: { name: '산문시',       desc: '산문의 흐름과 시적 감각의 결합' },    en: { name: 'Prose Poetry',     desc: 'Prose flow meets poetic sensibility' } },
];

export const FORMAT_AI_CONTEXT: Record<string, string> = {
  novel_literary:   '순문학/문예소설. 문체의 완성도, 인물 심리의 깊이, 감각적 묘사, 인간 조건에 대한 통찰을 중시하세요.',
  novel_romance:    '로맨스 소설. 두 인물의 감정적 화학작용, 갈등과 해소의 긴장감, 감정선의 자연스러운 발전이 핵심입니다.',
  novel_thriller:   '스릴러/미스터리 소설. 긴장감 유지, 속도감 있는 문장, 복선과 반전이 핵심입니다. 매 장면이 독자를 다음 장으로 끌어야 합니다.',
  novel_fantasy:    '판타지 소설. 세계관의 내적 일관성, 마법 시스템의 규칙 준수, 영웅의 여정 구조를 유지하세요.',
  novel_scifi:      'SF 소설. 과학적/기술적 개념의 내적 일관성, 기술과 인간성의 관계, 미래 사회의 설득력 있는 묘사가 중요합니다.',
  novel_horror:     '호러 소설. 공포의 점진적 구축, 독자의 불안감 조성, 심리적 공포와 실존적 위협을 균형 있게 다루세요.',
  novel_historical: '역사 소설. 시대적 배경의 세부 묘사, 당시 언어와 사회상의 진정성, 역사적 사실과 허구의 균형을 유지하세요.',
  fairy_tale:       '동화. 단순하고 아름다운 언어, 상징적 캐릭터(선/악의 대비), 교훈과 마법 요소, 아이들이 이해할 수 있는 명료한 구조를 유지하세요.',
  ya_fiction:       '청소년 소설(YA). 성장과 자기발견, 또래 관계와 정체성, 첫 경험의 강렬함을 진솔하게 다루세요.',
  essay_personal:   '개인 에세이. 진솔한 개인 경험에서 출발해 보편적 통찰로 확장하세요. 글쓴이의 목소리가 뚜렷해야 합니다.',
  essay_critical:   '비평/분석 에세이. 논리적 구조, 근거와 논거의 체계적 전개, 비판적 사고가 핵심입니다.',
  essay_travel:     '여행기. 장소와 사람의 생생한 묘사, 여행자의 시각과 발견, 이국적 디테일의 포착이 중요합니다.',
  journal:          '일기/저널. 개인적이고 성찰적인 어조, 솔직하고 자유로운 표현, 그날의 감정과 생각을 여과 없이 담으세요.',
  journal_reflection:'성찰 일기. 깊은 내면 탐구, 과거 경험의 재해석, 자기 이해를 위한 질문을 중심으로 쓰세요.',
  memoir:           '회고록. 실제 경험을 바탕으로 한 이야기. 기억의 복잡성을 인정하며, 과거와 현재를 오가며 삶의 의미를 재구성하세요.',
  article:          '기사/보도문. 명확하고 정확한 사실 전달, 역피라미드 구조(중요한 것 먼저), 객관적이고 간결한 문체를 사용하세요.',
  bio:              '소개문/자기소개서. 명확한 아이덴티티 전달, 강점과 경험의 스토리텔링, 대상 독자에 맞는 어조를 사용하세요.',
  poetry:           '시. 압축된 이미지와 언어, 리듬과 소리의 효과, 행 구분의 의미, 여백과 침묵을 의식하세요.',
  prose_poetry:     '산문시. 산문의 자유로운 흐름과 시의 이미지·리듬감을 결합하세요.',
};

export interface Style {
  id: string; icon: string; hue: number; swatch: string;
  en: { name: string; hint: string };
  kr: { name: string; hint: string };
}

export interface Chapter {
  id: string; n: number; title: string; words: number;
  status: 'draft' | 'styled' | 'new'; updated: string;
}

export interface Starter {
  tag: string; title: string; body: string;
}

export interface Sample {
  raw: string; literary?: string; minimalist?: string;
  [key: string]: string | undefined;
}

export interface T {
  brand: string; tagline: string;
  nav_works: string; nav_drafts: string; nav_archive: string; nav_trash: string; nav_bible: string;
  ob_greet_top: string; ob_greet: string; ob_q: string; ob_sub: string;
  ob_start: string; ob_skip: string;
  lvl_kids_name: string; lvl_kids_desc: string; lvl_kids_features: string[];
  lvl_beginner_name: string; lvl_beginner_desc: string; lvl_beginner_features: string[];
  lvl_growing_name: string; lvl_growing_desc: string; lvl_growing_features: string[];
  lvl_pro_name: string; lvl_pro_desc: string; lvl_pro_features: string[];
  dash_greeting: string; dash_continue: string; dash_new_chapter: string;
  dash_stats_words: string; dash_stats_streak: string; dash_stats_styled: string;
  dash_recent: string; dash_starters: string;
  ed_starters_title: string; ed_starters_sub: string;
  ed_transform: string; ed_words: string; ed_chars: string;
  ed_focus: string; ed_save: string; ed_analysis: string;
  sp_title: string; sp_sub: string; sp_apply: string; sp_preview: string;
  sp_tone: string; sp_length: string; sp_lang: string;
  sp_tone_warm: string; sp_tone_neutral: string; sp_tone_cool: string;
  sp_len_short: string; sp_len_keep: string; sp_len_long: string;
  diff_title: string; diff_before: string; diff_after: string;
  diff_accept: string; diff_revert: string; diff_partial: string; diff_inki: string;
  an_title: string; an_sub: string; an_recommend: string;
  an_pace: string; an_emotion: string; an_voice: string; an_apply_rec: string;
  fc_exit: string; fc_hint: string;
  bible_title: string; bible_sub: string;
  tab_premise: string; tab_chars: string; tab_world: string; tab_timeline: string;
  pr_genre: string; pr_logline: string; pr_themes: string; pr_tone: string;
  pr_pov: string; pr_tense: string; pr_setting: string; pr_themes_pick: string;
  ch_add: string; ch_role: string; ch_age: string; ch_traits: string;
  ch_voice: string; ch_wants: string; ch_fears: string; ch_arc: string;
  ch_rel: string; ch_portrait: string; ch_portrait_hint: string;
  role_protagonist: string; role_mirror: string; role_antagonist: string; role_symbol: string;
  w_places: string; w_objects: string; w_backstory: string; w_rules: string;
  tl_beats: string; tl_chapters: string;
}

export const STYLES: Style[] = [
  { id: 'literary',    icon: '✦', hue: 22,  swatch: '#C8633D', en: { name: 'Literary',      hint: 'Lyrical, layered, observational' },          kr: { name: '문학적',   hint: '서정적이고 관찰적인 결' } },
  { id: 'creative',    icon: '✺', hue: 280, swatch: '#8B6FB8', en: { name: 'Creative',      hint: 'Playful imagery and unexpected turns' },      kr: { name: '창의적',   hint: '유희적인 이미지와 의외의 전환' } },
  { id: 'minimalist',  icon: '▪', hue: 0,   swatch: '#2A2520', en: { name: 'Minimalist',    hint: 'Cut to the bone. Few words, lots of air.' },  kr: { name: '미니멀',   hint: '뼈만 남기기. 적은 단어, 넉넉한 여백.' } },
  { id: 'journalistic',icon: '◐', hue: 210, swatch: '#3A5F8A', en: { name: 'Journalistic',  hint: 'Factual, clear, on the record' },              kr: { name: '저널리즘', hint: '사실 기반, 명료한 기록' } },
  { id: 'academic',    icon: '◇', hue: 195, swatch: '#4A6B7A', en: { name: 'Academic',      hint: 'Precise, cited, formal register' },            kr: { name: '학술적',   hint: '정확하고 격식 있는 어조' } },
  { id: 'poetic',      icon: '❋', hue: 340, swatch: '#B5527A', en: { name: 'Poetic',        hint: 'Rhythm, line breaks, breath' },                kr: { name: '시적',     hint: '운율, 행갈이, 호흡' } },
  { id: 'conversational',icon: '◌',hue:35, swatch: '#D4915B', en: { name: 'Conversational',hint: 'Like talking to a close friend' },             kr: { name: '대화체',   hint: '가까운 친구에게 말하듯' } },
  { id: 'noir',        icon: '◼', hue: 240, swatch: '#1F2238', en: { name: 'Noir',          hint: 'Hard-boiled, shadowy, terse' },                kr: { name: '느와르',   hint: '냉소적이고 그늘진 단문' } },
  { id: 'whimsical',   icon: '✿', hue: 145, swatch: '#6B8E5A', en: { name: 'Whimsical',    hint: 'Light, curious, fairy-tale tilt' },            kr: { name: '동화적',   hint: '가볍고 호기심 어린 동화풍' } },
  { id: 'epic',        icon: '✦', hue: 18,  swatch: '#8B4A2A', en: { name: 'Epic',          hint: 'Grand scale, mythic cadence' },                kr: { name: '서사적',   hint: '웅장한 스케일, 신화적 호흡' } },
];

export const STARTERS: Record<Lang, Starter[]> = {
  kr: [
    { tag: '장면', title: '비 오는 날의 창가',        body: '비가 창문에 닿는 소리로 시작하는 한 문단을 써보세요.' },
    { tag: '인물', title: '오래된 친구의 편지',        body: '10년 만에 받은 편지의 첫 줄을 상상해 보세요.' },
    { tag: '감정', title: '잊혀진 약속',               body: '지키지 못한 약속이 떠오른 순간을 묘사해 보세요.' },
    { tag: '풍경', title: '도시의 새벽 다섯 시',        body: '아무도 없는 거리에서 본 풍경을 적어 보세요.' },
    { tag: '대화', title: '엘리베이터에서의 짧은 만남', body: '낯선 두 사람의 짧은 대화로 시작합니다.' },
    { tag: '기억', title: '할머니의 부엌',              body: '냄새가 먼저 떠오르는 기억의 한 장면.' },
  ],
  en: [
    { tag: 'Scene',   title: 'By the rain-streaked window', body: 'Open with the sound of rain meeting glass.' },
    { tag: 'Person',  title: 'A letter from an old friend',  body: 'Imagine the first line of a letter ten years late.' },
    { tag: 'Feeling', title: 'A forgotten promise',          body: 'Describe the moment a broken promise resurfaces.' },
    { tag: 'Place',   title: 'The city at 5 a.m.',           body: 'Capture a street with no one in it.' },
    { tag: 'Dialog',  title: 'A short ride in an elevator',  body: 'Begin with two strangers exchanging words.' },
    { tag: 'Memory',  title: "Grandmother's kitchen",        body: 'A memory where the smell arrives first.' },
  ],
};

export const CHAPTERS: Record<Lang, Chapter[]> = {
  kr: [
    { id: 'ch1', n: 1, title: '비 오는 강',  words: 1842, status: 'draft',  updated: '오늘 14:32' },
    { id: 'ch2', n: 2, title: '낯선 정거장', words: 2105, status: 'styled', updated: '어제' },
    { id: 'ch3', n: 3, title: '오래된 약속', words: 938,  status: 'draft',  updated: '3일 전' },
    { id: 'ch4', n: 4, title: '잿빛 아침',   words: 0,    status: 'new',    updated: '—' },
  ],
  en: [
    { id: 'ch1', n: 1, title: 'River in the Rain',   words: 1842, status: 'draft',  updated: 'Today 2:32 PM' },
    { id: 'ch2', n: 2, title: 'A Stranger Station',  words: 2105, status: 'styled', updated: 'Yesterday' },
    { id: 'ch3', n: 3, title: 'An Old Promise',      words: 938,  status: 'draft',  updated: '3 days ago' },
    { id: 'ch4', n: 4, title: 'Ash-grey Morning',    words: 0,    status: 'new',    updated: '—' },
  ],
};

export const SAMPLE: Record<Lang, Sample> = {
  kr: {
    raw: '비가 오기 시작했다. 나는 창가에 앉아 있었다. 거리에는 아무도 없었고, 가로등 하나만 깜박이고 있었다. 그날 아침 받은 편지가 책상 위에 그대로 놓여 있었다. 봉투에는 그녀의 이름이 적혀 있었지만, 나는 아직 그것을 열어보지 못했다. 시간이 천천히 흘렀다.',
    literary: '비가 내리기 시작한 것은, 마치 누군가 오래 참아온 말을 떨어뜨리듯 조용했다. 나는 창가에 앉아, 거리에 흩어진 빛 하나가 어떻게 깜박이는지를 오래 바라보았다. 그녀의 이름이 적힌 봉투는 아침부터 책상 위에 그대로였다. 열어볼 용기는, 아직 빗소리 안에 잠겨 있었다.',
    minimalist: '비가 왔다. 창가에 앉았다. 거리는 비어 있었고, 가로등 하나가 깜박였다. 책상 위에 편지가 있었다. 그녀의 이름. 아직 열지 않았다. 시간은 흘렀다.',
  },
  en: {
    raw: 'It started to rain. I was sitting by the window. The street was empty, and a single streetlamp was blinking. The letter I had received that morning was still lying on the desk. The envelope had her name on it, but I had not opened it yet. Time passed slowly.',
    literary: 'The rain began the way someone might let go of a held breath — quiet, almost apologetic. I sat by the window and watched a lone streetlamp flicker, its rhythm steadier than my own. Her envelope rested on the desk where I had left it that morning, the name written there in the careful hand I once knew. I had not yet found the courage to open it; the courage seemed to be somewhere inside the rain.',
    minimalist: 'It began to rain. I sat by the window. The street was empty. One streetlamp blinked. The letter was on the desk. Her name. I had not opened it. Time passed.',
  },
};

export const NOTES: Record<Lang, string[]> = {
  kr: [
    '빗소리를 인물의 마음과 연결해 천천히 시작했어요.',
    '"오래"라는 시간 감각을 더해서 호흡을 늘렸어요.',
    '봉투를 묘사하면서 그녀와의 관계를 슬며시 비췄어요.',
    '"열어볼 용기"를 비에 잠겼다고 표현해서 여운을 남겼어요.',
  ],
  en: [
    'I opened slower, letting the rain mirror the held breath.',
    'Added "steadier than my own" to root the scene in your narrator.',
    'Made the handwriting personal — it hints at a shared past.',
    'Left the courage inside the rain so the ending lingers.',
  ],
};

export const GENRES: Genre[] = [
  { id: 'literary', swatch: '#C8633D', icon: '✦', kr: { name: '문학 소설', desc: '내면의 결과 일상의 균열' },       en: { name: 'Literary', desc: 'Interior grain, the cracks of everyday life' } },
  { id: 'mystery',  swatch: '#3A5F8A', icon: '◐', kr: { name: '미스터리', desc: '단서, 의심, 마지막 한 페이지의 전환' }, en: { name: 'Mystery',  desc: 'Clues, doubt, the last-page turn' } },
  { id: 'romance',  swatch: '#B5527A', icon: '❋', kr: { name: '로맨스',   desc: '관계의 호흡과 망설임의 결' },       en: { name: 'Romance',  desc: 'The rhythm of two people, hesitations included' } },
  { id: 'sf',       swatch: '#4A6B7A', icon: '◇', kr: { name: 'SF',       desc: '낯선 세계의 규칙과 인간의 자리' },    en: { name: 'Sci-Fi',   desc: 'Rules of a stranger world, and our place in it' } },
  { id: 'fantasy',  swatch: '#6B8E5A', icon: '✺', kr: { name: '판타지',   desc: '경계 너머의 풍경과 마법의 대가' },    en: { name: 'Fantasy',  desc: 'Landscapes past the edge, the cost of magic' } },
  { id: 'thriller', swatch: '#1F2238', icon: '◼', kr: { name: '스릴러',   desc: '시간이 부족한 사람들과 닫혀가는 문' }, en: { name: 'Thriller', desc: 'People running out of time, doors closing' } },
  { id: 'essay',    swatch: '#8B6FB8', icon: '◌', kr: { name: '에세이',   desc: '나의 시선으로 쓰는 한 편의 산문' },   en: { name: 'Essay',    desc: 'A piece of prose written through your own eye' } },
  { id: 'fable',    swatch: '#D4915B', icon: '✿', kr: { name: '동화',     desc: '작고 단단한 세계, 다정한 결말' },     en: { name: 'Fable',    desc: 'A small steady world, a kind ending' } },
];

export const THEMES: Record<Lang, string[]> = {
  kr: ['그리움', '성장', '정체성', '용서', '상실', '시간', '연대', '귀향', '낯섦', '회복', '권력', '기억'],
  en: ['Longing', 'Growth', 'Identity', 'Forgiveness', 'Loss', 'Time', 'Solidarity', 'Homecoming', 'Strangeness', 'Healing', 'Power', 'Memory'],
};

export const PREMISE: Record<Lang, Premise> = {
  kr: { genre: 'literary', logline: '오래된 약속이 적힌 편지 한 통이 도착하면서, 한 사람이 십 년 전의 강가로 천천히 되돌아간다.', themes: ['그리움', '시간', '귀향'], tone: 'serene', pov: '1인칭', tense: '과거형', setting: '비가 자주 내리는 강가 도시, 2010년대 후반' },
  en: { genre: 'literary', logline: 'A letter bearing an old promise arrives, and a quiet person walks back, slowly, to a riverbank ten years gone.', themes: ['Longing', 'Time', 'Homecoming'], tone: 'serene', pov: 'First-person', tense: 'Past', setting: 'A river town that rains often, late 2010s' },
};

export const CHARACTERS: Record<Lang, Character[]> = {
  kr: [
    { id: 'ch_yune', role: 'protagonist', portraitId: 'yune', name: '유은', age: 32, oneLine: '서점을 운영하며 강가 도시에 살고 있는 1인칭 화자.', traits: ['조용함', '관찰적', '쉽게 말하지 않음', '비를 좋아함'], voice: '말이 짧고 비유가 많다. 단어 끝을 흘리듯 말한다.', wants: '편지를 보낸 사람을 다시 만나는 것', fears: '결국 자신이 변하지 않았다는 사실', arc: '망설이는 사람 → 천천히 결심하는 사람', relationships: [{ with: '도하', label: '오래된 친구이자 미해결의 사람' }] },
    { id: 'ch_doha', role: 'mirror', portraitId: 'doha', name: '도하', age: 33, oneLine: '편지를 보낸 사람. 십 년 전 약속을 지키러 돌아왔다.', traits: ['따뜻함', '약간의 미안함', '결심한 사람의 단단함'], voice: '문장이 길고 평어와 경어 사이를 오간다.', wants: '오래된 약속을 마무리하는 것', fears: '돌아왔는데도 닿지 못하는 것', arc: '돌아온 사람 → 다시 떠나야 하는 사람', relationships: [{ with: '유은', label: '서로에게 가장 오래된 풍경' }] },
    { id: 'ch_river', role: 'symbol', portraitId: 'river', name: '강', age: null, oneLine: '도시를 가로지르는 진짜 주인공이자 시간의 은유.', traits: ['천천히 흐름', '계절마다 다른 색', '모든 것을 기억함'], voice: '말이 없다. 소리로만 존재한다.', wants: '—', fears: '—', arc: '풍경 → 상징 → 다시 풍경', relationships: [] },
  ],
  en: [
    { id: 'ch_yune', role: 'protagonist', portraitId: 'yune', name: 'Yune', age: 32, oneLine: 'A bookseller in the river town; our first-person narrator.', traits: ['Quiet', 'Observational', 'Slow to speak', 'Loves the rain'], voice: 'Short sentences, many metaphors. Lets word-endings trail off.', wants: 'To see the sender of the letter again', fears: "That, in the end, she hasn't changed", arc: 'Hesitating → slowly resolving', relationships: [{ with: 'Doha', label: 'Old friend, unresolved' }] },
    { id: 'ch_doha', role: 'mirror', portraitId: 'doha', name: 'Doha', age: 33, oneLine: 'The sender of the letter. Returned to keep a ten-year promise.', traits: ['Warm', 'A little apologetic', 'Steady with conviction'], voice: 'Long sentences. Drifts between formal and intimate.', wants: 'To close out the old promise', fears: 'Returning, and still not reaching', arc: 'The returning one → the one who must leave again', relationships: [{ with: 'Yune', label: "Each other's oldest landscape" }] },
    { id: 'ch_river', role: 'symbol', portraitId: 'river', name: 'The River', age: null, oneLine: "The town's true protagonist; a metaphor for time.", traits: ['Flows slowly', 'Different color each season', 'Remembers everything'], voice: 'Silent. Exists only as sound.', wants: '—', fears: '—', arc: 'Landscape → symbol → landscape again', relationships: [] },
  ],
};

export const WORLD: Record<Lang, World> = {
  kr: {
    places: [
      { id: 'p1', name: '강가 서점',   note: '주인공이 운영하는 작은 헌책방. 비 오는 날엔 손님이 없다.' },
      { id: 'p2', name: '낡은 다리',   note: '도시를 둘로 가르는 다리. 십 년 전 두 사람이 약속을 했던 곳.' },
      { id: 'p3', name: '북쪽 정거장', note: '도하가 도시로 들어오는 첫 장면의 무대.' },
    ],
    objects: [
      { id: 'o1', name: '편지 한 통',    note: '봉투에 그녀의 이름. 아직 열어보지 않았다.' },
      { id: 'o2', name: '오래된 가로등', note: '깜박임. 챕터의 리듬 장치.' },
    ],
    backstory: '두 사람은 십 년 전 강가의 다리에서 약속을 했다. 십 년 뒤 같은 날 같은 자리에서 만나자고. 한 사람은 도시를 떠났고, 한 사람은 남았다. 떠난 사람이 먼저 돌아왔다.',
  },
  en: {
    places: [
      { id: 'p1', name: 'Riverside bookshop', note: "The narrator's small used-book shop. Empty on rainy days." },
      { id: 'p2', name: 'The old bridge',     note: 'It cuts the town in two. Site of the ten-year promise.' },
      { id: 'p3', name: 'North station',      note: 'The first stage — where Doha arrives back in town.' },
    ],
    objects: [
      { id: 'o1', name: 'A single letter',   note: 'Her name on the envelope. Unopened.' },
      { id: 'o2', name: 'An old streetlamp', note: 'Flickers. Doubles as a chapter rhythm device.' },
    ],
    backstory: "Ten years ago, two people made a promise on a bridge by the river — to meet again, same day, same place, ten years on. One left the town, one stayed. The one who left came back first.",
  },
};

export const BEATS: Record<Lang, Beat[]> = {
  kr: [
    { id: 'b1', title: '도착',      pos:  6, ch: 1, desc: '편지가 도착한다. 비가 시작된다.' },
    { id: 'b2', title: '망설임',    pos: 18, ch: 1, desc: '봉투를 열지 못한 채 창가에 앉아 있다.' },
    { id: 'b3', title: '재회',      pos: 36, ch: 2, desc: '북쪽 정거장에서 두 사람이 마주친다.' },
    { id: 'b4', title: '오래된 다리', pos: 52, ch: 3, desc: '다리에서 십 년 전 약속을 함께 떠올린다.' },
    { id: 'b5', title: '균열',      pos: 68, ch: 3, desc: '한 사람의 진짜 이유가 드러난다.' },
    { id: 'b6', title: '결심',      pos: 84, ch: 4, desc: '편지를 열고, 한 줄을 천천히 읽는다.' },
    { id: 'b7', title: '여운',      pos: 96, ch: 4, desc: '비가 그친다. 강은 그대로 흐른다.' },
  ],
  en: [
    { id: 'b1', title: 'Arrival',        pos:  6, ch: 1, desc: 'The letter arrives. The rain begins.' },
    { id: 'b2', title: 'Hesitation',     pos: 18, ch: 1, desc: 'She sits by the window, envelope unopened.' },
    { id: 'b3', title: 'Reunion',        pos: 36, ch: 2, desc: 'They meet again at the north station.' },
    { id: 'b4', title: 'The Old Bridge', pos: 52, ch: 3, desc: 'On the bridge, both remember the promise.' },
    { id: 'b5', title: 'Fracture',       pos: 68, ch: 3, desc: 'One of them reveals the true reason.' },
    { id: 'b6', title: 'Resolve',        pos: 84, ch: 4, desc: 'She opens the letter and reads, slowly.' },
    { id: 'b7', title: 'Afterglow',      pos: 96, ch: 4, desc: 'The rain stops. The river keeps flowing.' },
  ],
};

export const T: Record<Lang, T> = {
  kr: {
    brand: 'CoWriter', tagline: '쓰는 일이 외롭지 않도록',
    nav_works: '작품', nav_drafts: '초고', nav_archive: '보관함', nav_trash: '휴지통', nav_bible: '작품 설정',
    ob_greet_top: '안녕, 나는 Inki야.',
    ob_greet: '오늘부터 함께 쓰자.\n먼저, 너에 대해 조금만 알려줘.',
    ob_q: '나는 어떤 작가일까?',
    ob_sub: '언제든 바꿀 수 있어요. 처음 화면을 어떻게 보여줄지 정하는 것뿐이에요.',
    ob_start: '시작하기', ob_skip: '나중에',
    lvl_kids_name: '어린이예요', lvl_kids_desc: '쉬운 말로 도와주고, 내가 직접 쓰도록 칭찬과 힌트를 줘요', lvl_kids_features: ['쉬운 낱말과 큰 글씨', '칭찬과 다정한 힌트', '안전하고 따뜻한 도움'],
    lvl_beginner_name: '이제 막 시작해요', lvl_beginner_desc: '빈 페이지가 무섭고, 어디서부터 써야 할지 모를 때', lvl_beginner_features: ['따뜻한 스타터 카드', '쉬운 3가지 스타일', '큰 글씨와 격려'],
    lvl_growing_name: '내 스타일을 찾는 중', lvl_growing_desc: '쓰는 일이 익숙해지고, 내 목소리를 다듬고 싶을 때', lvl_growing_features: ['10가지 스타일', '간단한 분석', '챕터 관리'],
    lvl_pro_name: '오래 써온 작가예요', lvl_pro_desc: '세밀한 컨트롤과 방해 없는 집중이 필요할 때', lvl_pro_features: ['세밀한 톤·길이 제어', '집중 모드', '키보드 단축키'],
    dash_greeting: '오늘도 좋아요', dash_continue: '이어쓰기', dash_new_chapter: '새 챕터',
    dash_stats_words: '이번 주 단어', dash_stats_streak: '연속', dash_stats_styled: '변환',
    dash_recent: '최근 챕터', dash_starters: '오늘의 스타터',
    ed_starters_title: '빈 페이지가 무섭다면', ed_starters_sub: '클릭하면 이 문장으로 시작할 수 있어요',
    ed_transform: '스타일로 변환', ed_words: '단어', ed_chars: '글자',
    ed_focus: '집중 모드', ed_save: '저장됨', ed_analysis: '흐름 분석',
    sp_title: '어떤 결로 다듬을까요?', sp_sub: '카드를 옆으로 넘기며 살펴보세요',
    sp_apply: '이 스타일로 변환', sp_preview: '미리보기',
    sp_tone: '톤', sp_length: '길이', sp_lang: '언어',
    sp_tone_warm: '따뜻하게', sp_tone_neutral: '중립', sp_tone_cool: '차분하게',
    sp_len_short: '짧게', sp_len_keep: '비슷하게', sp_len_long: '풍성하게',
    diff_title: '변환 결과', diff_before: '원본', diff_after: '변환',
    diff_accept: '적용', diff_revert: '되돌리기', diff_partial: '문장별로 선택', diff_inki: 'Inki의 메모',
    an_title: '흐름 분석', an_sub: '글의 결을 살펴봤어요', an_recommend: '추천 스타일',
    an_pace: '호흡', an_emotion: '감정 곡선', an_voice: '목소리', an_apply_rec: '추천 적용',
    fc_exit: '집중 모드 종료', fc_hint: '쓰는 데만 집중해요. 다른 건 모두 잠시 숨겨두었어요.',
    bible_title: '작품 설정', bible_sub: '쓰기 전에, 세계를 정리해 두면 길을 잃지 않아요.',
    tab_premise: '전제', tab_chars: '캐릭터', tab_world: '세계관', tab_timeline: '타임라인',
    pr_genre: '장르', pr_logline: '한 줄 요약', pr_themes: '주제', pr_tone: '톤',
    pr_pov: '시점', pr_tense: '시제', pr_setting: '배경', pr_themes_pick: '클릭해서 추가/제거',
    ch_add: '+ 캐릭터 추가', ch_role: '역할', ch_age: '나이', ch_traits: '성격',
    ch_voice: '말투', ch_wants: '원하는 것', ch_fears: '두려운 것', ch_arc: '변화의 곡선',
    ch_rel: '관계', ch_portrait: '초상화', ch_portrait_hint: '이미지를 드래그해서 올려주세요',
    role_protagonist: '주인공', role_mirror: '거울', role_antagonist: '적대자', role_symbol: '상징',
    w_places: '장소', w_objects: '소품', w_backstory: '비하인드 스토리', w_rules: '세계의 규칙',
    tl_beats: '비트 시트', tl_chapters: '챕터별 위치',
  },
  en: {
    brand: 'CoWriter', tagline: "So that writing isn't lonely",
    nav_works: 'Works', nav_drafts: 'Drafts', nav_archive: 'Archive', nav_trash: 'Trash', nav_bible: 'Story bible',
    ob_greet_top: "Hi, I'm Inki.",
    ob_greet: "Let's write together.\nFirst, tell me a little about you.",
    ob_q: 'What kind of writer are you?',
    ob_sub: 'You can change this anytime. It just sets how the first screens feel.',
    ob_start: 'Get started', ob_skip: 'Skip for now',
    lvl_kids_name: "I'm a kid", lvl_kids_desc: 'Easy words, lots of praise, and gentle hints so you write it yourself', lvl_kids_features: ['Simple words, bigger type', 'Praise and kind hints', 'Safe, warm help'],
    lvl_beginner_name: 'Just starting out', lvl_beginner_desc: "When the blank page feels scary and you don't know where to begin", lvl_beginner_features: ['Warm starter cards', 'Three easy styles', 'Bigger type, kind nudges'],
    lvl_growing_name: 'Finding my voice', lvl_growing_desc: 'Writing is starting to feel natural and I want to refine my tone', lvl_growing_features: ['Ten styles', 'Light analysis', 'Chapter management'],
    lvl_pro_name: 'Been writing a long time', lvl_pro_desc: 'I want fine control and a distraction-free room of my own', lvl_pro_features: ['Granular tone & length', 'Focus mode', 'Keyboard shortcuts'],
    dash_greeting: "Glad you're back", dash_continue: 'Continue writing', dash_new_chapter: 'New chapter',
    dash_stats_words: 'Words this week', dash_stats_streak: 'Day streak', dash_stats_styled: 'Styled',
    dash_recent: 'Recent chapters', dash_starters: "Today's starters",
    ed_starters_title: 'If the page feels intimidating', ed_starters_sub: 'Click one to start with that sentence',
    ed_transform: 'Transform style', ed_words: 'words', ed_chars: 'chars',
    ed_focus: 'Focus', ed_save: 'Saved', ed_analysis: 'Flow analysis',
    sp_title: 'Which grain should we follow?', sp_sub: 'Swipe through the cards to compare',
    sp_apply: 'Apply this style', sp_preview: 'Preview',
    sp_tone: 'Tone', sp_length: 'Length', sp_lang: 'Language',
    sp_tone_warm: 'Warm', sp_tone_neutral: 'Neutral', sp_tone_cool: 'Cool',
    sp_len_short: 'Shorter', sp_len_keep: 'Similar', sp_len_long: 'Fuller',
    diff_title: 'Transform result', diff_before: 'Original', diff_after: 'Styled',
    diff_accept: 'Accept', diff_revert: 'Revert', diff_partial: 'Pick line by line', diff_inki: "Inki's note",
    an_title: 'Flow analysis', an_sub: 'I read the grain of your draft', an_recommend: 'Recommended style',
    an_pace: 'Pace', an_emotion: 'Emotion arc', an_voice: 'Voice', an_apply_rec: 'Apply recommendation',
    fc_exit: 'Exit focus', fc_hint: 'Just write. Everything else is tucked away for a moment.',
    bible_title: 'Story bible', bible_sub: 'Lay out the world before you write — it keeps you from getting lost.',
    tab_premise: 'Premise', tab_chars: 'Characters', tab_world: 'World', tab_timeline: 'Timeline',
    pr_genre: 'Genre', pr_logline: 'Logline', pr_themes: 'Themes', pr_tone: 'Tone',
    pr_pov: 'POV', pr_tense: 'Tense', pr_setting: 'Setting', pr_themes_pick: 'Click to toggle',
    ch_add: '+ Add character', ch_role: 'Role', ch_age: 'Age', ch_traits: 'Traits',
    ch_voice: 'Voice', ch_wants: 'Wants', ch_fears: 'Fears', ch_arc: 'Arc',
    ch_rel: 'Relationships', ch_portrait: 'Portrait', ch_portrait_hint: 'Drag an image here',
    role_protagonist: 'Protagonist', role_mirror: 'Mirror', role_antagonist: 'Antagonist', role_symbol: 'Symbol',
    w_places: 'Places', w_objects: 'Objects', w_backstory: 'Backstory', w_rules: 'Rules',
    tl_beats: 'Beat sheet', tl_chapters: 'Chapter map',
  },
};
