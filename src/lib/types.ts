/**
 * Modelo de dados derivado do CapCut.
 *
 * Fonte: `__MODERN_ROUTER_DATA__.loaderData.$.templateDetail` (web) e
 * `templateDetail` do bundle Lynx `image_lynx_main_template` (APK).
 * Os nomes de campo foram mantidos iguais aos do produto original para que
 * trocar o mock por uma API real não exija refatorar a UI.
 */

export type Collection = {
  collectionId: string;
  text: string;
};

export type Author = {
  uid: string;
  secUid: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  description?: string;
};

export type Template = {
  templateId: string;
  title: string;
  desc: string;
  coverUrl: string;
  videoUrl: string;

  videoRatio: string;
  videoWidth: number;
  videoHeight: number;

  playAmount: number;
  usageAmount: number;
  segmentAmount: number;
  likeAmount: number;
  commentAmount: number;

  /** Duração em milissegundos (o produto original usa ms, não s). */
  templateDuration: number;
  /** Epoch em segundos. */
  createTime: number;

  collections: Collection[];
  author: Author;

  isPro: boolean;
  isAvailable: boolean;
};

export type FeedPage = {
  items: Template[];
  /** Cursor opaco, igual ao feed real (`has_more` + `cursor`). */
  cursor: string | null;
  hasMore: boolean;
};

export type SessionUser = {
  uid: string;
  name: string;
  avatarUrl: string;
  /** `guest` = device_login sem conta; `member` = conta vinculada. */
  kind: 'guest' | 'member';
  region: string;
};

export type ExportTaskState = 'queued' | 'processing' | 'success' | 'failed';

export type ExportTask = {
  taskId: string;
  state: ExportTaskState;
  progress: number;
  resultUrl?: string;
  message?: string;
};
