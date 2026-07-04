import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/test-app.js';
import { prisma } from '../lib/prisma.js';

describe('Workflow Routes - 流程模板', () => {
  let app: FastifyInstance;
  const createdTemplateIds: number[] = [];
  const createdInstanceIds: number[] = [];

  afterEach(async () => {
    for (const id of createdInstanceIds) {
      try { await prisma.workflowInstanceNode.deleteMany({ where: { instanceId: id } }); } catch {}
      try { await prisma.workflowInstance.delete({ where: { id } }); } catch {}
    }
    createdInstanceIds.length = 0;

    for (const id of createdTemplateIds) {
      try { await prisma.workflowTemplate.update({ where: { id }, data: { deletedAt: new Date() } }); } catch {}
      try { await prisma.workflowTemplate.delete({ where: { id } }); } catch {}
    }
    createdTemplateIds.length = 0;

    if (app) {
      await app.close();
    }
  });

  // ─── Slice 1: 创建流程模板 ──────────────────────────────────
  it('POST /api/workflow/templates - 创建流程模板', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/workflow/templates',
      payload: {
        name: '请假审批流程',
        description: '员工请假审批',
        nodes: [
          { type: 'START', label: '开始', position: { x: 400, y: 50 } },
          { type: 'APPROVAL', label: '主管审批', position: { x: 400, y: 180 }, assigneeType: 'ROLE', assigneeId: null, signType: 'OR' },
          { type: 'END', label: '结束', position: { x: 400, y: 350 } },
        ],
        edges: [
          { sourceNodeIndex: 0, targetNodeIndex: 1 },
          { sourceNodeIndex: 1, targetNodeIndex: 2 },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBeTypeOf('number');
    expect(body.data.name).toBe('请假审批流程');
    expect(body.data.version).toBe(1);
    expect(body.data.status).toBe('DRAFT');
    createdTemplateIds.push(body.data.id);
  });

  it('POST /api/workflow/templates - 缺少 START/END 节点返回错误', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/workflow/templates',
      payload: {
        name: '无效流程',
        nodes: [
          { type: 'APPROVAL', label: '主管审批', position: { x: 400, y: 180 }, assigneeType: 'ROLE', assigneeId: null, signType: 'OR' },
        ],
        edges: [],
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).not.toBe(0);
  });

  // ─── Slice 2: 模板列表 ──────────────────────────────────────
  it('GET /api/workflow/templates - 分页查询模板列表', async () => {
    app = await buildTestApp();
    for (let i = 0; i < 2; i++) {
      const t = await prisma.workflowTemplate.create({
        data: {
          name: `列表模板_${i}`,
          nodes: [{ type: 'START', label: '开始', position: { x: 400, y: 50 } }, { type: 'END', label: '结束', position: { x: 400, y: 350 } }],
          edges: [{ sourceNodeIndex: 0, targetNodeIndex: 1 }],
        },
      });
      createdTemplateIds.push(t.id);
    }

    const response = await app.inject({
      method: 'GET',
      url: '/api/workflow/templates?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(2);
  });

  // ─── Slice 3: 获取单条 ──────────────────────────────────────
  it('GET /api/workflow/templates/:id - 获取模板详情', async () => {
    app = await buildTestApp();
    const t = await prisma.workflowTemplate.create({
      data: {
        name: '详情模板',
        nodes: [{ type: 'START', label: '开始', position: { x: 400, y: 50 } }, { type: 'END', label: '结束', position: { x: 400, y: 350 } }],
        edges: [{ sourceNodeIndex: 0, targetNodeIndex: 1 }],
      },
    });
    createdTemplateIds.push(t.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/workflow/templates/${t.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBe(t.id);
    expect(body.data.name).toBe('详情模板');
  });

  it('GET /api/workflow/templates/:id - 不存在返回null', async () => {
    app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/workflow/templates/99999' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data).toBeNull();
  });

  // ─── Slice 4: 更新/删除 ─────────────────────────────────────
  it('PUT /api/workflow/templates/:id - 更新模板', async () => {
    app = await buildTestApp();
    const t = await prisma.workflowTemplate.create({
      data: {
        name: '更新前',
        nodes: [{ type: 'START', label: '开始', position: { x: 400, y: 50 } }, { type: 'END', label: '结束', position: { x: 400, y: 350 } }],
        edges: [{ sourceNodeIndex: 0, targetNodeIndex: 1 }],
      },
    });
    createdTemplateIds.push(t.id);

    const response = await app.inject({
      method: 'PUT',
      url: `/api/workflow/templates/${t.id}`,
      payload: { name: '更新后', description: '更新描述' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.name).toBe('更新后');
  });

  it('DELETE /api/workflow/templates/:id - 软删除模板', async () => {
    app = await buildTestApp();
    const t = await prisma.workflowTemplate.create({
      data: {
        name: '删除模板',
        nodes: [{ type: 'START', label: '开始', position: { x: 400, y: 50 } }, { type: 'END', label: '结束', position: { x: 400, y: 350 } }],
        edges: [{ sourceNodeIndex: 0, targetNodeIndex: 1 }],
      },
    });
    createdTemplateIds.push(t.id);

    const response = await app.inject({ method: 'DELETE', url: `/api/workflow/templates/${t.id}` });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data).toBeNull();

    const found = await prisma.workflowTemplate.findUnique({ where: { id: t.id } });
    expect(found?.deletedAt).not.toBeNull();
  });

  // ─── Slice 5: 发布模板 ──────────────────────────────────────
  it('POST /api/workflow/templates/:id/publish - 发布模板', async () => {
    app = await buildTestApp();
    const t = await prisma.workflowTemplate.create({
      data: {
        name: '发布模板',
        nodes: [{ type: 'START', label: '开始', position: { x: 400, y: 50 } }, { type: 'END', label: '结束', position: { x: 400, y: 350 } }],
        edges: [{ sourceNodeIndex: 0, targetNodeIndex: 1 }],
      },
    });
    createdTemplateIds.push(t.id);

    const response = await app.inject({ method: 'POST', url: `/api/workflow/templates/${t.id}/publish` });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.status).toBe('PUBLISHED');
  });

  // ─── Slice 5.5: 边标签保存 ──────────────────────────────────
  it('POST /api/workflow/templates - 保存带标签的边', async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/workflow/templates',
      payload: {
        name: '条件分支模板',
        nodes: [
          { type: 'START', label: '开始', position: { x: 400, y: 50 } },
          { type: 'CONDITION', label: '金额判断', position: { x: 400, y: 180 }, conditions: [{ conditionType: 'AMOUNT_THRESHOLD', operator: 'GT', conditionValue: '1000' }] },
          { type: 'APPROVAL', label: '高级审批', position: { x: 200, y: 350 }, assigneeType: 'USER', assigneeId: 1, signType: 'OR' },
          { type: 'END', label: '结束', position: { x: 400, y: 500 } },
        ],
        edges: [
          { sourceNodeIndex: 0, targetNodeIndex: 1 },
          { sourceNodeIndex: 1, targetNodeIndex: 2, label: '通过' },
          { sourceNodeIndex: 1, targetNodeIndex: 3, label: '拒绝' },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    createdTemplateIds.push(body.data.id);

    const saved = await prisma.workflowTemplate.findUnique({ where: { id: body.data.id } });
    const edges = saved?.edges as any[];
    expect(edges).toHaveLength(3);
    expect(edges[1].label).toBe('通过');
    expect(edges[2].label).toBe('拒绝');
  });
});

describe('Workflow Routes - 审批实例', () => {
  let app: FastifyInstance;
  const createdTemplateIds: number[] = [];
  const createdInstanceIds: number[] = [];
  const createdEmployeeIds: number[] = [];

  const createTestTemplate = async () => {
    const t = await prisma.workflowTemplate.create({
      data: {
        name: '审批模板',
        status: 'PUBLISHED',
        nodes: [
          { type: 'START', label: '开始', position: { x: 400, y: 50 } },
          { type: 'APPROVAL', label: '主管审批', position: { x: 400, y: 180 }, assigneeType: 'USER', assigneeId: 1, signType: 'OR' },
          { type: 'END', label: '结束', position: { x: 400, y: 350 } },
        ],
        edges: [
          { sourceNodeIndex: 0, targetNodeIndex: 1 },
          { sourceNodeIndex: 1, targetNodeIndex: 2 },
        ],
      },
    });
    createdTemplateIds.push(t.id);
    return t;
  };

  const createTestEmployee = async () => {
    const e = await prisma.employee.create({
      data: {
        name: `审批员工_${Date.now()}`,
        employeeNo: `WF_${Date.now().toString().slice(-12)}`.slice(0, 20),
        phone: '13800138000',
        idCard: '110101199001011234',
        hireDate: new Date('2024-01-01'),
      },
    });
    createdEmployeeIds.push(e.id);
    return e;
  };

  afterEach(async () => {
    for (const id of createdInstanceIds) {
      try { await prisma.workflowInstanceNode.deleteMany({ where: { instanceId: id } }); } catch {}
      try { await prisma.workflowInstance.delete({ where: { id } }); } catch {}
    }
    createdInstanceIds.length = 0;

    for (const id of createdTemplateIds) {
      try { await prisma.workflowTemplate.delete({ where: { id } }); } catch {}
    }
    createdTemplateIds.length = 0;

    for (const id of createdEmployeeIds) {
      try { await prisma.employee.delete({ where: { id } }); } catch {}
    }
    createdEmployeeIds.length = 0;

    if (app) {
      await app.close();
    }
  });

  // ─── Slice 6: 发起审批 ──────────────────────────────────────
  it('POST /api/workflow/instances - 发起审批', async () => {
    app = await buildTestApp();
    const t = await createTestTemplate();
    const e = await createTestEmployee();

    const response = await app.inject({
      method: 'POST',
      url: '/api/workflow/instances',
      payload: {
        templateId: t.id,
        subject: '请假申请',
        formData: { leaveDays: 3, reason: '生病' },
        sourceType: 'LEAVE',
        sourceId: 1,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBeTypeOf('number');
    expect(body.data.status).toBe('IN_PROGRESS');
    expect(body.data.subject).toBe('请假申请');
    expect(body.data.templateName).toBe('审批模板');
    createdInstanceIds.push(body.data.id);

    const nodes = await prisma.workflowInstanceNode.findMany({ where: { instanceId: body.data.id } });
    expect(nodes.length).toBe(3);
  });

  // ─── Slice 7: 实例列表 ──────────────────────────────────────
  it('GET /api/workflow/instances - 查询审批实例列表', async () => {
    app = await buildTestApp();
    const t = await createTestTemplate();

    for (let i = 0; i < 2; i++) {
      const inst = await prisma.workflowInstance.create({
        data: {
          templateId: t.id,
          templateName: t.name,
          subject: `实例_${i}`,
          formData: {},
          sourceType: 'OTHER',
          sourceId: i + 1,
          applicantId: 1,
          applicantName: '测试用户',
        },
      });
      createdInstanceIds.push(inst.id);
    }

    const response = await app.inject({
      method: 'GET',
      url: '/api/workflow/instances?page=1&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(2);
  });

  // ─── Slice 8: 实例详情 ──────────────────────────────────────
  it('GET /api/workflow/instances/:id - 获取审批详情', async () => {
    app = await buildTestApp();
    const t = await createTestTemplate();

    const inst = await prisma.workflowInstance.create({
      data: {
        templateId: t.id,
        templateName: t.name,
        subject: '详情实例',
        formData: {},
        sourceType: 'OTHER',
        sourceId: 1,
        applicantId: 1,
        applicantName: '测试用户',
      },
    });
    createdInstanceIds.push(inst.id);

    const response = await app.inject({
      method: 'GET',
      url: `/api/workflow/instances/${inst.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.id).toBe(inst.id);
    expect(body.data.subject).toBe('详情实例');
  });

  // ─── Slice 9: 审批通过 ──────────────────────────────────────
  it('POST /api/workflow/instances/:id/approve - 审批通过', async () => {
    app = await buildTestApp();
    const t = await createTestTemplate();

    const inst = await prisma.workflowInstance.create({
      data: {
        templateId: t.id,
        templateName: t.name,
        subject: '审批实例',
        formData: {},
        sourceType: 'OTHER',
        sourceId: 1,
        applicantId: 1,
        applicantName: '测试用户',
        status: 'IN_PROGRESS',
      },
    });
    createdInstanceIds.push(inst.id);

    await prisma.workflowInstanceNode.create({
      data: { instanceId: inst.id, nodeIndex: 1, type: 'APPROVAL', label: '主管审批', assigneeId: 1, signType: 'OR', status: 'PENDING' },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/workflow/instances/${inst.id}/approve`,
      payload: { comment: '同意' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.status).toBe('APPROVED');
  });

  // ─── Slice 10: 审批驳回 ─────────────────────────────────────
  it('POST /api/workflow/instances/:id/reject - 审批驳回', async () => {
    app = await buildTestApp();
    const t = await createTestTemplate();

    const inst = await prisma.workflowInstance.create({
      data: {
        templateId: t.id,
        templateName: t.name,
        subject: '驳回实例',
        formData: {},
        sourceType: 'OTHER',
        sourceId: 1,
        applicantId: 1,
        applicantName: '测试用户',
        status: 'IN_PROGRESS',
      },
    });
    createdInstanceIds.push(inst.id);

    await prisma.workflowInstanceNode.create({
      data: { instanceId: inst.id, nodeIndex: 1, type: 'APPROVAL', label: '主管审批', assigneeId: 1, signType: 'OR', status: 'PENDING' },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/workflow/instances/${inst.id}/reject`,
      payload: { reason: '不符合规定' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    expect(body.data.status).toBe('REJECTED');
  });

  // ─── Slice 11: 动态审批人 - 部门负责人 ────────────────────────
  it('POST /api/workflow/instances - 部门负责人自动解析', async () => {
    app = await buildTestApp();

    const rank = await prisma.rank.upsert({
      where: { level: 100 },
      create: { name: '测试职级', level: 100 },
      update: { name: '测试职级' },
    });
    const manager = await createTestEmployee();
    const dept = await prisma.department.create({
      data: { name: `测试部门_${Date.now()}`, managerId: manager.id },
    });
    const position = await prisma.position.create({
      data: { name: '测试岗位', departmentId: dept.id, rankId: rank.id },
    });
    const applicant = await prisma.employee.create({
      data: {
        name: `申请人_${Date.now()}`,
        employeeNo: `APP_${Date.now().toString().slice(-12)}`.slice(0, 20),
        phone: '13800138001',
        idCard: '110101199001011235',
        hireDate: new Date('2024-01-01'),
      },
    });
    const user = await prisma.user.create({
      data: {
        username: `user_${Date.now()}`,
        passwordHash: 'test',
        employeeId: applicant.id,
      },
    });
    createdEmployeeIds.push(manager.id, applicant.id);

    await prisma.employeePosition.create({
      data: { employeeId: applicant.id, positionId: position.id, startDate: new Date('2024-01-01') },
    });

    const t = await prisma.workflowTemplate.create({
      data: {
        name: '部门负责人审批',
        status: 'PUBLISHED',
        nodes: [
          { type: 'START', label: '开始', position: { x: 400, y: 50 } },
          { type: 'APPROVAL', label: '部门负责人审批', position: { x: 400, y: 180 }, assigneeType: 'DEPARTMENT_LEADER', assigneeId: null, signType: 'OR' },
          { type: 'END', label: '结束', position: { x: 400, y: 350 } },
        ],
        edges: [
          { sourceNodeIndex: 0, targetNodeIndex: 1 },
          { sourceNodeIndex: 1, targetNodeIndex: 2 },
        ],
      },
    });
    createdTemplateIds.push(t.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/workflow/instances',
      payload: {
        templateId: t.id,
        subject: '报销申请',
        formData: { amount: 1000 },
        sourceType: 'EXPENSE',
        sourceId: 1,
        applicantId: user.id,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    createdInstanceIds.push(body.data.id);

    const nodes = await prisma.workflowInstanceNode.findMany({
      where: { instanceId: body.data.id },
      orderBy: { nodeIndex: 'asc' },
    });
    const approvalNode = nodes.find((n) => n.type === 'APPROVAL');
    expect(approvalNode?.assigneeId).toBe(manager.id);
  });

  // ─── Slice 12: 动态审批人 - 直属上级 ──────────────────────────
  it('POST /api/workflow/instances - 直属上级自动解析', async () => {
    app = await buildTestApp();

    const supervisor = await createTestEmployee();
    const applicant = await prisma.employee.create({
      data: {
        name: `申请人_${Date.now()}`,
        employeeNo: `APP_${Date.now().toString().slice(-12)}`.slice(0, 20),
        phone: '13800138002',
        idCard: '110101199001011236',
        hireDate: new Date('2024-01-01'),
        supervisorId: supervisor.id,
      },
    });
    const user = await prisma.user.create({
      data: {
        username: `user_sup_${Date.now()}`,
        passwordHash: 'test',
        employeeId: applicant.id,
      },
    });
    createdEmployeeIds.push(supervisor.id, applicant.id);

    const t = await prisma.workflowTemplate.create({
      data: {
        name: '直属上级审批',
        status: 'PUBLISHED',
        nodes: [
          { type: 'START', label: '开始', position: { x: 400, y: 50 } },
          { type: 'APPROVAL', label: '直属上级审批', position: { x: 400, y: 180 }, assigneeType: 'SUPERVISOR', assigneeId: null, signType: 'OR' },
          { type: 'END', label: '结束', position: { x: 400, y: 350 } },
        ],
        edges: [
          { sourceNodeIndex: 0, targetNodeIndex: 1 },
          { sourceNodeIndex: 1, targetNodeIndex: 2 },
        ],
      },
    });
    createdTemplateIds.push(t.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/workflow/instances',
      payload: {
        templateId: t.id,
        subject: '请假申请',
        formData: { days: 2 },
        sourceType: 'LEAVE',
        sourceId: 1,
        applicantId: user.id,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.code).toBe(0);
    createdInstanceIds.push(body.data.id);

    const nodes = await prisma.workflowInstanceNode.findMany({
      where: { instanceId: body.data.id },
      orderBy: { nodeIndex: 'asc' },
    });
    const approvalNode = nodes.find((n) => n.type === 'APPROVAL');
    expect(approvalNode?.assigneeId).toBe(supervisor.id);
  });

  // ─── Slice 13: 并发审批幂等性 ──────────────────────────────
  it('POST /api/workflow/instances/:id/approve - 并发审批同一节点只生效一次', async () => {
    app = await buildTestApp();
    const t = await createTestTemplate();

    const inst = await prisma.workflowInstance.create({
      data: {
        templateId: t.id,
        templateName: t.name,
        subject: '并发审批测试',
        formData: {},
        sourceType: 'OTHER',
        sourceId: 999,
        applicantId: 1,
        applicantName: '测试用户',
        status: 'IN_PROGRESS',
      },
    });
    createdInstanceIds.push(inst.id);

    await prisma.workflowInstanceNode.create({
      data: {
        instanceId: inst.id,
        nodeIndex: 1,
        type: 'APPROVAL',
        label: '主管审批',
        assigneeId: 1,
        signType: 'OR',
        status: 'PENDING',
      },
    });

    const results = await Promise.allSettled([
      app.inject({
        method: 'POST',
        url: `/api/workflow/instances/${inst.id}/approve`,
        payload: { comment: '同意1' },
      }),
      app.inject({
        method: 'POST',
        url: `/api/workflow/instances/${inst.id}/approve`,
        payload: { comment: '同意2' },
      }),
    ]);

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.statusCode === 200,
    );
    const failed = results.filter(
      (r) => r.status === 'fulfilled' && r.value.statusCode !== 200,
    );

    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);

    const finalInst = await prisma.workflowInstance.findUnique({
      where: { id: inst.id },
    });
    expect(finalInst?.status).toBe('APPROVED');

    const approvedNodeCount = await prisma.workflowInstanceNode.count({
      where: { instanceId: inst.id, type: 'APPROVAL', status: 'APPROVED' },
    });
    expect(approvedNodeCount).toBe(1);
  });

  it('POST /api/workflow/instances/:id/reject - 并发驳回同一节点只生效一次', async () => {
    app = await buildTestApp();
    const t = await createTestTemplate();

    const inst = await prisma.workflowInstance.create({
      data: {
        templateId: t.id,
        templateName: t.name,
        subject: '并发驳回测试',
        formData: {},
        sourceType: 'OTHER',
        sourceId: 998,
        applicantId: 1,
        applicantName: '测试用户',
        status: 'IN_PROGRESS',
      },
    });
    createdInstanceIds.push(inst.id);

    await prisma.workflowInstanceNode.create({
      data: {
        instanceId: inst.id,
        nodeIndex: 1,
        type: 'APPROVAL',
        label: '主管审批',
        assigneeId: 1,
        signType: 'OR',
        status: 'PENDING',
      },
    });

    const results = await Promise.allSettled([
      app.inject({
        method: 'POST',
        url: `/api/workflow/instances/${inst.id}/reject`,
        payload: { reason: '原因1' },
      }),
      app.inject({
        method: 'POST',
        url: `/api/workflow/instances/${inst.id}/reject`,
        payload: { reason: '原因2' },
      }),
    ]);

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.statusCode === 200,
    );
    const failed = results.filter(
      (r) => r.status === 'fulfilled' && r.value.statusCode !== 200,
    );

    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);

    const finalInst = await prisma.workflowInstance.findUnique({
      where: { id: inst.id },
    });
    expect(finalInst?.status).toBe('REJECTED');
  });
});
