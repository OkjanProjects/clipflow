import { COLLECTIONS, TEMPLATES, TEMPLATE_CATEGORY } from '@/lib/mock-data';
import type { Collection, ExportTask, FeedPage, Template } from '@/lib/types';

/**
 * Camada de dados.
 *
 * Os caminhos abaixo são os mesmos do produto original (extraídos dos 24 DEX e
 * dos bundles Lynx). Em modo `mock` eles são respondidos localmente; em modo
 * `remote` batem no host real — que exige sessão e devolve `ret: 1015`
 * ("check login error") para anônimos, exatamente como o BFF web.
 */
const REMOTE_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

export const apiMode: 'mock' | 'remote' = REMOTE_BASE ? 'remote' : 'mock';

export const ENDPOINTS = {
  collections: '/lv/v1/replicate/get_collections',
  collectionTemplates: '/lv/v2/replicate/get_collection_templates',
  multiGetTemplates: '/lv/v1/replicate/multi_get_templates',
  recommendations: '/lv/v1/homepage/templates',
  taskNew: '/lv/v1/common_task/new',
  taskQuery: '/lv/v1/common_task/query',
} as const;

export class ApiError extends Error {
  readonly ret: string;
  readonly status: number;

  constructor(ret: string, message: string, status = 200) {
    super(message);
    this.name = 'ApiError';
    this.ret = ret;
    this.status = status;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function remote<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${REMOTE_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as {
    ret?: string;
    errmsg?: string;
    data?: T;
  };

  if (!response.ok) {
    throw new ApiError(body.ret ?? String(response.status), body.errmsg ?? 'Falha de rede', response.status);
  }
  // O backend do CapCut responde HTTP 200 com `ret` de erro no corpo.
  if (body.ret && body.ret !== '0') {
    throw new ApiError(body.ret, body.errmsg ?? 'Erro desconhecido');
  }
  return (body.data ?? body) as T;
}

const PAGE_SIZE = 6;

export async function getCollections(): Promise<Collection[]> {
  if (apiMode === 'remote') {
    return remote<Collection[]>(ENDPOINTS.collections, { method: 'GET' });
  }
  await delay(180);
  return COLLECTIONS;
}

export async function getFeed(params?: {
  collectionId?: string;
  cursor?: string | null;
  query?: string;
}): Promise<FeedPage> {
  if (apiMode === 'remote') {
    return remote<FeedPage>(ENDPOINTS.collectionTemplates, {
      method: 'POST',
      body: JSON.stringify({
        collection_id: params?.collectionId ?? '10001',
        cursor: params?.cursor ?? '',
        count: PAGE_SIZE,
      }),
    });
  }

  await delay(320 + Math.random() * 260);

  const query = params?.query?.trim().toLowerCase();
  let items = [...TEMPLATES];

  if (params?.collectionId && params.collectionId !== '10001') {
    items = items.filter((t) => t.collections.some((c) => c.collectionId === params.collectionId));
  }
  if (query) {
    items = items.filter((t) =>
      [t.title, t.desc, t.author.name, TEMPLATE_CATEGORY[t.templateId] ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }

  const offset = Number(params?.cursor ?? 0) || 0;
  const page = items.slice(offset, offset + PAGE_SIZE);
  const next = offset + PAGE_SIZE;

  return {
    items: page,
    cursor: next < items.length ? String(next) : null,
    hasMore: next < items.length,
  };
}

export async function getTemplate(templateId: string): Promise<Template> {
  if (apiMode === 'remote') {
    const items = await remote<Template[]>(ENDPOINTS.multiGetTemplates, {
      method: 'POST',
      body: JSON.stringify({ template_ids: [templateId] }),
    });
    const found = Array.isArray(items) ? items[0] : items;
    if (!found) throw new ApiError('1021', 'Template não encontrado');
    return found;
  }

  await delay(240);
  const found = TEMPLATES.find((t) => t.templateId === templateId);
  if (!found) throw new ApiError('1021', 'Template não encontrado');
  return found;
}

export async function getRecommendations(templateId: string, limit = 8): Promise<Template[]> {
  if (apiMode === 'remote') {
    return remote<Template[]>(`${ENDPOINTS.recommendations}?template_id=${templateId}`);
  }
  await delay(200);
  return TEMPLATES.filter((t) => t.templateId !== templateId).slice(0, limit);
}

export async function searchTemplates(query: string): Promise<Template[]> {
  const page = await getFeed({ query, collectionId: '10001' });
  return page.items;
}

/* -------------------------------------------------------------------------- */
/* Fila de render — o mesmo contrato assíncrono do CapCut:                     */
/*   POST /lv/v1/common_task/new   -> { task_id }                              */
/*   GET  /lv/v1/common_task/query -> { state, progress, url }                 */
/* -------------------------------------------------------------------------- */

const taskStore = new Map<string, ExportTask>();

export async function submitExportTask(template: Template): Promise<ExportTask> {
  if (apiMode === 'remote') {
    return remote<ExportTask>(ENDPOINTS.taskNew, {
      method: 'POST',
      body: JSON.stringify({ template_id: template.templateId, type: 'export' }),
    });
  }

  await delay(420);
  const taskId = `task_${Date.now().toString(36)}`;
  const task: ExportTask = { taskId, state: 'queued', progress: 0 };
  taskStore.set(taskId, task);
  return task;
}

export async function queryExportTask(taskId: string): Promise<ExportTask> {
  if (apiMode === 'remote') {
    return remote<ExportTask>(`${ENDPOINTS.taskQuery}?task_id=${taskId}`);
  }

  await delay(120);
  const task = taskStore.get(taskId);
  if (!task) throw new ApiError('1030', 'Tarefa expirada');

  const step = 9 + Math.random() * 13;
  task.progress = Math.min(100, task.progress + step);
  task.state = task.progress >= 100 ? 'success' : 'processing';
  if (task.state === 'success') {
    task.resultUrl = `https://example.com/exports/${taskId}.mp4`;
  }
  return { ...task };
}
