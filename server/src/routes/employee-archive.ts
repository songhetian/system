import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  zEmployeeContractCreate,
  zEmployeeContractUpdate,
  zEmployeeContract,
  zEmployeeDocumentCreate,
  zEmployeeDocument,
  zEmployeeEventCreate,
  zEmployeeEvent,
} from '@shop/shared';
import { createResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import {
  createEmployeeContract,
  listEmployeeContracts,
  getEmployeeContract,
  updateEmployeeContract,
  terminateEmployeeContract,
  createEmployeeDocument,
  listEmployeeDocuments,
  getEmployeeDocument,
  verifyEmployeeDocument,
  deleteEmployeeDocument,
  createEmployeeEvent,
  listEmployeeEvents,
  getEmployeeEvent,
  getEmployeeArchive,
} from '../services/employee-archive.service.js';

// ponytail: Prisma Date → schema 期望的 ISO datetime / date string
function toContractView(c: any) {
  return {
    ...c,
    startDate: c.startDate?.toISOString().split('T')[0] ?? null,
    endDate: c.endDate?.toISOString().split('T')[0] ?? null,
    probationEndDate: c.probationEndDate?.toISOString().split('T')[0] ?? null,
    createdAt: c.createdAt?.toISOString() ?? null,
    updatedAt: c.updatedAt?.toISOString() ?? null,
  };
}

function toDocumentView(d: any) {
  return {
    ...d,
    createdAt: d.createdAt?.toISOString() ?? null,
    updatedAt: d.updatedAt?.toISOString() ?? null,
  };
}

function toEventView(e: any) {
  return {
    ...e,
    effectiveDate: e.effectiveDate?.toISOString().split('T')[0] ?? null,
    createdAt: e.createdAt?.toISOString() ?? null,
  };
}

const idParamsSchema = zodToSchema(z.object({ id: z.coerce.number().int().positive() }));
const employeeIdParamsSchema = zodToSchema(z.object({ employeeId: z.coerce.number().int().positive() }));

const zContractQuery = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});
const zDocumentQuery = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  type: z.string().optional(),
});
const zEventQuery = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  type: z.string().optional(),
});
const zTerminateBody = z.object({ reason: z.string().max(500).optional() });
const zVerifyBody = z.object({ verified: z.boolean() });

const zArchive = z.object({
  contracts: z.array(zEmployeeContract),
  documents: z.array(zEmployeeDocument),
  events: z.array(zEmployeeEvent),
});

export const employeeArchiveRoutes: FastifyPluginAsync = async (app) => {

  // 模块级权限：GET → employee:read，其他 → employee:write
  app.addHook('onRequest', async (request, reply) => {
    const perm = request.method === 'GET' ? 'employee:read' : 'employee:write';
    if (request.permissions?.has('admin:all')) return;
    if (!request.permissions?.has(perm)) {
      reply.status(403).send({ code: 20001, data: null, message: '无权限' });
    }
  });

  // ── Archive aggregate ──

  app.get(
    '/:employeeId',
    {
      schema: {
        params: employeeIdParamsSchema,
        response: { 200: createResponseSchema(zArchive) },
      },
    },
    async (request, reply) => {
      const { employeeId } = request.params as any;
      const archive = await getEmployeeArchive(Number(employeeId));
      return {
        code: 0,
        data: {
          contracts: archive.contracts.map(toContractView),
          documents: archive.documents.map(toDocumentView),
          events: archive.events.map(toEventView),
        },
        message: 'success',
      };
    },
  );

  // ── Contracts ──

  app.post(
    '/contracts',
    {
      schema: {
        body: zodToSchema(zEmployeeContractCreate),
        response: { 200: createResponseSchema(zEmployeeContract) },
      },
    },
    async (request, reply) => {
      const body = zEmployeeContractCreate.parse(request.body);
      try {
        const contract = await createEmployeeContract(body);
        return { code: 0, data: toContractView(contract), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.get(
    '/contracts',
    {
      schema: {
        querystring: zodToSchema(zContractQuery),
        response: { 200: createResponseSchema(z.array(zEmployeeContract)) },
      },
    },
    async (request, reply) => {
      const query = zContractQuery.parse(request.query);
      const contracts = await listEmployeeContracts(query.employeeId, query.status);
      return { code: 0, data: contracts.map(toContractView), message: 'success' };
    },
  );

  app.get(
    '/contracts/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(zEmployeeContract.nullable()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const contract = await getEmployeeContract(Number(id));
      return { code: 0, data: toContractView(contract), message: 'success' };
    },
  );

  app.put(
    '/contracts/:id',
    {
      schema: {
        params: idParamsSchema,
        body: zodToSchema(zEmployeeContractUpdate),
        response: { 200: createResponseSchema(zEmployeeContract) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = zEmployeeContractUpdate.parse(request.body);
      try {
        const contract = await updateEmployeeContract(Number(id), body);
        return { code: 0, data: toContractView(contract), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.post(
    '/contracts/:id/terminate',
    {
      schema: {
        params: idParamsSchema,
        body: zodToSchema(zTerminateBody),
        response: { 200: createResponseSchema(zEmployeeContract) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = zTerminateBody.parse(request.body);
      try {
        const contract = await terminateEmployeeContract(Number(id), body.reason);
        return { code: 0, data: toContractView(contract), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  // ── Documents ──

  app.post(
    '/documents',
    {
      schema: {
        body: zodToSchema(zEmployeeDocumentCreate),
        response: { 200: createResponseSchema(zEmployeeDocument) },
      },
    },
    async (request, reply) => {
      const body = zEmployeeDocumentCreate.parse(request.body);
      try {
        const doc = await createEmployeeDocument(body);
        return { code: 0, data: toDocumentView(doc), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.get(
    '/documents',
    {
      schema: {
        querystring: zodToSchema(zDocumentQuery),
        response: { 200: createResponseSchema(z.array(zEmployeeDocument)) },
      },
    },
    async (request, reply) => {
      const query = zDocumentQuery.parse(request.query);
      const docs = await listEmployeeDocuments(query.employeeId, query.type);
      return { code: 0, data: docs.map(toDocumentView), message: 'success' };
    },
  );

  app.get(
    '/documents/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(zEmployeeDocument.nullable()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const doc = await getEmployeeDocument(Number(id));
      return { code: 0, data: toDocumentView(doc), message: 'success' };
    },
  );

  app.post(
    '/documents/:id/verify',
    {
      schema: {
        params: idParamsSchema,
        body: zodToSchema(zVerifyBody),
        response: { 200: createResponseSchema(zEmployeeDocument) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = zVerifyBody.parse(request.body);
      try {
        const doc = await verifyEmployeeDocument(Number(id), body.verified);
        return { code: 0, data: toDocumentView(doc), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.delete(
    '/documents/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(z.null()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      await deleteEmployeeDocument(Number(id));
      return { code: 0, data: null, message: 'success' };
    },
  );

  // ── Events ──

  app.post(
    '/events',
    {
      schema: {
        body: zodToSchema(zEmployeeEventCreate),
        response: { 200: createResponseSchema(zEmployeeEvent) },
      },
    },
    async (request, reply) => {
      const body = zEmployeeEventCreate.parse(request.body);
      try {
        const event = await createEmployeeEvent(body);
        return { code: 0, data: toEventView(event), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.get(
    '/events',
    {
      schema: {
        querystring: zodToSchema(zEventQuery),
        response: { 200: createResponseSchema(z.array(zEmployeeEvent)) },
      },
    },
    async (request, reply) => {
      const query = zEventQuery.parse(request.query);
      const events = await listEmployeeEvents(query.employeeId, query.type);
      return { code: 0, data: events.map(toEventView), message: 'success' };
    },
  );

  app.get(
    '/events/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: createResponseSchema(zEmployeeEvent.nullable()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const event = await getEmployeeEvent(Number(id));
      return { code: 0, data: toEventView(event), message: 'success' };
    },
  );
};
