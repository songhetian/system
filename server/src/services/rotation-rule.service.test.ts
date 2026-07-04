import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import {
  createRotationRule,
  findAllRotationRules,
  findRotationRuleById,
  updateRotationRule,
} from './rotation-rule.service.js';
import type { RotationRuleCreate } from '@shop/shared';

describe('RotationRule Service', () => {
  beforeEach(async () => {
    await prisma.rotationRule.deleteMany({});
  });

  afterEach(async () => {
    await prisma.rotationRule.deleteMany({});
  });

  const testRule: RotationRuleCreate = {
    name: '三班倒规则',
    pattern: [
      { dayOffset: 0, shiftTemplateId: 1 },
      { dayOffset: 1, shiftTemplateId: 2 },
      { dayOffset: 2, shiftTemplateId: 3 },
    ],
    cycleDays: 3,
  };

  it('创建轮班规则成功', async () => {
    const result = await createRotationRule(testRule);
    expect(result).toHaveProperty('id');
    expect(result.name).toBe(testRule.name);
    expect(result.cycleDays).toBe(testRule.cycleDays);
  });

  it('创建轮班规则时 pattern.length !== cycleDays 失败', async () => {
    const invalidRule: RotationRuleCreate = {
      ...testRule,
      pattern: [
        { dayOffset: 0, shiftTemplateId: 1 },
        { dayOffset: 1, shiftTemplateId: 2 },
      ],
      cycleDays: 3,
    };
    await expect(createRotationRule(invalidRule)).rejects.toThrow();
  });

  it('获取所有轮班规则', async () => {
    await createRotationRule(testRule);
    await createRotationRule({
      ...testRule,
      name: '两班倒规则',
      pattern: [
        { dayOffset: 0, shiftTemplateId: 1 },
        { dayOffset: 1, shiftTemplateId: 2 },
      ],
      cycleDays: 2,
    });

    const result = await findAllRotationRules();
    expect(result.length).toBe(2);
  });

  it('更新轮班规则', async () => {
    const created = await createRotationRule(testRule);
    const updateData = {
      name: '三班倒规则-修改',
      cycleDays: 4,
      pattern: [
        { dayOffset: 0, shiftTemplateId: 1 },
        { dayOffset: 1, shiftTemplateId: 2 },
        { dayOffset: 2, shiftTemplateId: 3 },
        { dayOffset: 3, shiftTemplateId: 1 },
      ],
    };
    const result = await updateRotationRule(created.id, updateData);
    expect(result.name).toBe(updateData.name);
    expect(result.cycleDays).toBe(updateData.cycleDays);
  });
});