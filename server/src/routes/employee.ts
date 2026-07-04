import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  zEmployeeCreate,
  zEmployeeUpdate,
  zEmployeeListItem,
  zEmployeeFullDetail,
  zEmployeeQuery,
  zRegularizeInput,
  zResignInput,
} from '@shop/shared';
import { createResponseSchema, createPaginatedResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import {
  createEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
  deleteEmployee,
  regularizeEmployee,
  resignEmployee,
} from '../services/employee.service.js';

// ponytail: Prisma Date → schema string，补充 positionIds
function toListItem(emp: any) {
  return {
    ...emp,
    hireDate: emp.hireDate?.toISOString().split('T')[0] ?? null,
    regularizeDate: emp.regularizeDate?.toISOString().split('T')[0] ?? null,
    resignDate: emp.resignDate?.toISOString().split('T')[0] ?? null,
    createdAt: emp.createdAt?.toISOString() ?? null,
    updatedAt: emp.updatedAt?.toISOString() ?? null,
    deletedAt: emp.deletedAt?.toISOString() ?? null,
    idCard: '****',
    phone: '****',
    positionIds: emp.employeePositions?.map((ep: any) => ep.positionId) ?? [],
    departmentId: emp.employeePositions?.[0]?.position?.departmentId ?? 0,
  };
}

function toFullDetail(emp: any) {
  return {
    ...emp,
    hireDate: emp.hireDate?.toISOString().split('T')[0] ?? null,
    regularizeDate: emp.regularizeDate?.toISOString().split('T')[0] ?? null,
    resignDate: emp.resignDate?.toISOString().split('T')[0] ?? null,
    createdAt: emp.createdAt?.toISOString() ?? null,
    updatedAt: emp.updatedAt?.toISOString() ?? null,
    deletedAt: emp.deletedAt?.toISOString() ?? null,
    positionIds: emp.employeePositions?.map((ep: any) => ep.positionId) ?? [],
    departmentId: emp.employeePositions?.[0]?.position?.departmentId ?? 0,
  };
}

export const employeeRoutes: FastifyPluginAsync = async (app) => {

  // 模块级权限：GET → employee:read，其他 → employee:write
  app.addHook('onRequest', async (request, reply) => {
    const method = request.method;
    const perm = method === 'GET' ? 'employee:read' : 'employee:write';
    if (request.permissions?.has('admin:all')) return;
    if (!request.permissions?.has(perm)) {
      reply.status(403).send({ code: 20001, data: null, message: '无权限' });
    }
  });

  app.post(
    '/',
    {
      schema: {
        body: zodToSchema(zEmployeeCreate),
        response: { 200: createResponseSchema(zEmployeeListItem) },
      },
    },
    async (request, reply) => {
      const body = zEmployeeCreate.parse(request.body);
      try {
        const emp = await createEmployee(body);
        const empWithPos = await getEmployeeById(emp.id);
        return { code: 0, data: toListItem(empWithPos), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.get(
    '/',
    {
      schema: {
        querystring: zodToSchema(zEmployeeQuery),
        response: { 200: createPaginatedResponseSchema(zEmployeeListItem) },
      },
    },
    async (request, reply) => {
      const query = zEmployeeQuery.parse(request.query);
      const result = await listEmployees(query);
      return { code: 0, data: { ...result, list: result.list.map(toListItem) }, message: 'success' };
    },
  );

  app.get(
    '/:id',
    {
      schema: {
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: { 200: createResponseSchema(zEmployeeListItem.nullable()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const emp = await getEmployeeById(Number(id));
      return { code: 0, data: emp ? toListItem(emp) : null, message: 'success' };
    },
  );

  app.get(
    '/:id/detail',
    {
      schema: {
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: { 200: createResponseSchema(zEmployeeFullDetail.nullable()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const emp = await getEmployeeById(Number(id));
      return { code: 0, data: emp ? toFullDetail(emp) : null, message: 'success' };
    },
  );

  app.put(
    '/:id',
    {
      schema: {
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        body: zodToSchema(zEmployeeUpdate),
        response: { 200: createResponseSchema(zEmployeeListItem) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = zEmployeeUpdate.parse(request.body);
      try {
        await updateEmployee(Number(id), body);
        const emp = await getEmployeeById(Number(id));
        return { code: 0, data: toListItem(emp), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.delete(
    '/:id',
    {
      schema: {
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        response: { 200: createResponseSchema(z.null()) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      await deleteEmployee(Number(id));
      return { code: 0, data: null, message: 'success' };
    },
  );

  app.post(
    '/:id/regularize',
    {
      schema: {
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        body: zodToSchema(zRegularizeInput),
        response: { 200: createResponseSchema(zEmployeeListItem) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = zRegularizeInput.parse(request.body);
      try {
        await regularizeEmployee(Number(id), body.regularizeDate);
        const emp = await getEmployeeById(Number(id));
        return { code: 0, data: toListItem(emp), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );

  app.post(
    '/:id/resign',
    {
      schema: {
        params: zodToSchema(z.object({ id: z.coerce.number().int().positive() })),
        body: zodToSchema(zResignInput),
        response: { 200: createResponseSchema(zEmployeeListItem) },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const body = zResignInput.parse(request.body);
      try {
        await resignEmployee(Number(id), body.resignDate, body.reason);
        const emp = await getEmployeeById(Number(id));
        return { code: 0, data: toListItem(emp), message: 'success' };
      } catch (err: any) {
        reply.status(400);
        return { code: 10000, data: null, message: err.message };
      }
    },
  );
};
