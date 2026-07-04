import { prisma } from '../lib/prisma.js';
import { uploadFile, getFileUrl, deleteFile } from '../lib/minio.js';
import { getCache, setCache, deleteCachePattern } from '../lib/redis.js';
import { Errors } from '../lib/errors.js';
import type { KbDocumentCreate, KbDocumentQuery } from '@shop/shared';

const KB_BUCKET = 'kb-documents';

export async function createKbDocument(data: KbDocumentCreate & { fileName: string; fileSize: number; fileData: Buffer }, uploaderId: number, uploaderName: string) {
  const fileUrl = await uploadFile(KB_BUCKET, data.fileName, data.fileData);

  const doc = await prisma.kbDocument.create({
    data: {
      title: data.title,
      category: data.category,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileUrl,
      isConfidential: data.isConfidential ?? false,
      uploaderId,
      uploaderName,
    },
  });

  await deleteCachePattern('kb:list:*');

  return doc;
}

export async function getKbDocumentById(id: number) {
  return prisma.kbDocument.findUnique({ where: { id } });
}

export async function listKbDocuments(query: KbDocumentQuery) {
  const cacheKey = `kb:list:${JSON.stringify(query)}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  const { page = 1, pageSize = 10, category, keyword, uploadDateFrom, uploadDateTo } = query;
  const where: any = {};
  if (category) where.category = category;
  if (keyword) where.title = { contains: keyword };
  if (uploadDateFrom || uploadDateTo) {
    where.createdAt = {};
    if (uploadDateFrom) where.createdAt.gte = new Date(uploadDateFrom);
    if (uploadDateTo) where.createdAt.lte = new Date(uploadDateTo);
  }

  const [list, total] = await Promise.all([
    prisma.kbDocument.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.kbDocument.count({ where }),
  ]);

  const result = { list, total, page, pageSize };
  await setCache(cacheKey, result, 60);

  return result;
}

export async function deleteKbDocument(id: number) {
  const doc = await prisma.kbDocument.findUnique({ where: { id } });
  if (doc) {
    try { await deleteFile(KB_BUCKET, doc.fileName); } catch {}
  }
  await prisma.kbDocument.delete({ where: { id } });
  await deleteCachePattern('kb:list:*');
}

export async function getKbPreviewUrl(id: number) {
  const doc = await prisma.kbDocument.findUnique({ where: { id } });
  if (!doc) throw Errors.notFound('文档不存在');

  const url = await getFileUrl(KB_BUCKET, doc.fileName, 60);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  return {
    url,
    expiresAt: expiresAt.toISOString(),
  };
}