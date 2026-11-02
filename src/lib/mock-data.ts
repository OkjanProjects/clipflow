import type { Collection, Template } from '@/lib/types';

/**
 * Coleções reais observadas no feed do CapCut (web + Lynx):
 * Following 70003, For You 10001, TikTok 10003, Effects 10002,
 * Celebrate 10006, Fandom 10012.
 */
export const COLLECTIONS: Collection[] = [
  { collectionId: '10001', text: 'For You' },
  { collectionId: '70003', text: 'Following' },
  { collectionId: '10003', text: 'TikTok' },
  { collectionId: '10002', text: 'Effects' },
  { collectionId: '10006', text: 'Celebrate' },
  { collectionId: '10012', text: 'Fandom' },
];

/** Categorias de hub observadas em capcut.com/template/*. */
export const CATEGORIES = [
  'social',
  'holiday',
  'calendar',
  'effects',
  'business',
  'industry',
  'record',
  'anniversary',
] as const;

const VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
];

function cover(seed: string) {
  return `https://picsum.photos/seed/${seed}/720/1280`;
}

type Seed = {
  id: string;
  title: string;
  desc: string;
  author: string;
  segments: number;
  duration: number;
  plays: number;
  uses: number;
  likes: number;
  comments: number;
  collections: string[];
  pro?: boolean;
  category?: string;
};

const SEEDS: Seed[] = [
  {
    id: '7625211784307248404',
    title: 'Social Media',
    desc: 'social media #socialmediatemplate #socialmediatemplates',
    author: 'capcut',
    segments: 7,
    duration: 85655,
    plays: 657608,
    uses: 29199,
    likes: 6987,
    comments: 374,
    collections: ['10001', '10003', '10002'],
    category: 'social',
  },
  {
    id: '7583666355010833717',
    title: 'CapCut Intro',
    desc: 'intro clean para reels e shorts #intro #capcut',
    author: 'capcut',
    segments: 4,
    duration: 12400,
    plays: 1204551,
    uses: 88112,
    likes: 22110,
    comments: 902,
    collections: ['10001', '10002'],
    category: 'effects',
  },
  {
    id: '7451443361803717894',
    title: 'Fears Social Anxiety',
    desc: 'funny foryou trend #relatable',
    author: 'lunapixel',
    segments: 9,
    duration: 41200,
    plays: 890123,
    uses: 44120,
    likes: 30122,
    comments: 1502,
    collections: ['10001', '10003'],
    category: 'social',
  },
  {
    id: '7542556976673344821',
    title: 'FYP Trend Viral Model',
    desc: 'viral model transition #fyp #trend',
    author: 'nexaclips',
    segments: 6,
    duration: 22300,
    plays: 2310044,
    uses: 122900,
    likes: 51200,
    comments: 3311,
    collections: ['10001', '10003', '10012'],
    category: 'social',
  },
  {
    id: '7597723682621902133',
    title: 'Me vs Social Media',
    desc: 'make it viral #makeitviral',
    author: 'theeditlab',
    segments: 12,
    duration: 60100,
    plays: 445612,
    uses: 19800,
    likes: 9822,
    comments: 410,
    collections: ['10001', '10003'],
    category: 'social',
  },
  {
    id: '7396970263939747078',
    title: 'New Trend',
    desc: 'newtrend beat drop #newtrend',
    author: 'kaiwav',
    segments: 5,
    duration: 18000,
    plays: 3120044,
    uses: 201233,
    likes: 77420,
    comments: 5210,
    collections: ['10001', '10002'],
    category: 'effects',
  },
  {
    id: '7569170949472406837',
    title: 'Social Anxiety',
    desc: 'social anxiety skit #skit',
    author: 'mariamakes',
    segments: 8,
    duration: 33000,
    plays: 120455,
    uses: 8122,
    likes: 4410,
    comments: 220,
    collections: ['10001'],
    category: 'social',
  },
  {
    id: '7393484772086942982',
    title: 'Real Fake Discord',
    desc: 'discord chat template #discord',
    author: 'ggstudio',
    segments: 3,
    duration: 9900,
    plays: 560223,
    uses: 31200,
    likes: 12900,
    comments: 640,
    collections: ['10001', '10012'],
    category: 'effects',
  },
  {
    id: '7581873418467806517',
    title: 'Social vs Personal',
    desc: 'relatable transition #cesarr',
    author: 'cesarr',
    segments: 10,
    duration: 52000,
    plays: 998321,
    uses: 55120,
    likes: 33210,
    comments: 1810,
    collections: ['10001', '10003'],
    category: 'social',
  },
  {
    id: '7529690322251582781',
    title: 'Trend FYP ツ',
    desc: 'anime trend #fyp',
    author: 'soraedits',
    segments: 14,
    duration: 47000,
    plays: 2043312,
    uses: 90122,
    likes: 61200,
    comments: 4020,
    collections: ['10001', '10012', '10002'],
    category: 'effects',
  },
  {
    id: '7337741502975626498',
    title: 'TikTok Trend Drew',
    desc: 'instagram + tiktok trend #drew',
    author: 'drewdaily',
    segments: 7,
    duration: 29000,
    plays: 771200,
    uses: 40110,
    likes: 21000,
    comments: 990,
    collections: ['10003'],
    category: 'social',
  },
  {
    id: '7479649793111821621',
    title: 'Viral IB Gooberish',
    desc: 'gooberish transition #viral',
    author: 'goober',
    segments: 6,
    duration: 21000,
    plays: 331002,
    uses: 15500,
    likes: 8110,
    comments: 330,
    collections: ['10001', '10012'],
    category: 'social',
  },
  {
    id: '7601000000000000001',
    title: 'Birthday Recap',
    desc: 'aniversário com fotos e música #birthday',
    author: 'partyframe',
    segments: 11,
    duration: 58000,
    plays: 210344,
    uses: 12400,
    likes: 6210,
    comments: 280,
    collections: ['10006'],
    category: 'anniversary',
  },
  {
    id: '7601000000000000002',
    title: 'Product Promo',
    desc: 'promo de produto em 15s #business',
    author: 'shopcut',
    segments: 5,
    duration: 15000,
    plays: 88122,
    uses: 6200,
    likes: 1900,
    comments: 88,
    collections: ['10001'],
    category: 'business',
  },
  {
    id: '7601000000000000003',
    title: 'Travel Calendar',
    desc: 'calendário de viagem #travel',
    author: 'wanderframes',
    segments: 12,
    duration: 44000,
    plays: 400212,
    uses: 22100,
    likes: 14200,
    comments: 510,
    collections: ['10006', '10001'],
    category: 'calendar',
  },
  {
    id: '7601000000000000004',
    title: 'Pro Cinematic Pack',
    desc: 'pacote cinematográfico com LUTs #pro',
    author: 'studiolut',
    segments: 16,
    duration: 72000,
    plays: 1550021,
    uses: 30211,
    likes: 40122,
    comments: 2201,
    collections: ['10002'],
    pro: true,
    category: 'effects',
  },
];

const collectionText = new Map(COLLECTIONS.map((c) => [c.collectionId, c]));

export const TEMPLATES: Template[] = SEEDS.map((s, i) => ({
  templateId: s.id,
  title: s.title,
  desc: s.desc,
  coverUrl: cover(s.id),
  videoUrl: VIDEOS[i % VIDEOS.length],
  videoRatio: '9:16',
  videoWidth: 714,
  videoHeight: 1280,
  playAmount: s.plays,
  usageAmount: s.uses,
  segmentAmount: s.segments,
  likeAmount: s.likes,
  commentAmount: s.comments,
  templateDuration: s.duration,
  createTime: 1775383020 - i * 86400,
  collections: s.collections
    .map((id) => collectionText.get(id))
    .filter((c): c is Collection => Boolean(c)),
  author: {
    uid: `u_${s.author}`,
    secUid: `MS4wLjABAAAA_${s.author}`,
    name: s.author,
    avatarUrl: `https://picsum.photos/seed/av_${s.author}/160/160`,
    profileUrl: `/discover/creator/MS4wLjABAAAA_${s.author}`,
    description: `@${s.author} · criador de templates`,
  },
  isPro: Boolean(s.pro),
  isAvailable: true,
}));

/** Categoria usada pelo hub `/template/*`; mantida só para filtro local. */
export const TEMPLATE_CATEGORY: Record<string, string> = Object.fromEntries(
  SEEDS.map((s) => [s.id, s.category ?? 'social'])
);
