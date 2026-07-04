import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { createShiftTemplate, findAllShiftTemplates, findShiftTemplateById, updateShiftTemplate, deleteShiftTemplate, } from './shift-template.service.js';
describe('ShiftTemplate Service', () => {
    const createdTemplates = [];
    afterEach(async () => {
        for (const id of createdTemplates) {
            try {
                await prisma.schedule.deleteMany({ where: { shiftTemplateId: id } });
                await prisma.shiftTemplate.delete({ where: { id } });
            }
            catch { }
        }
        createdTemplates.length = 0;
    });
    it('创建班次模板成功', async () => {
        const testTemplate = {
            name: `早班_${Date.now()}`,
            startTime: '08:00',
            endTime: '16:00',
            color: '#FF5733',
            description: '标准早班',
        };
        const result = await createShiftTemplate(testTemplate);
        createdTemplates.push(result.id);
        expect(result).toHaveProperty('id');
        expect(result.name).toBe(testTemplate.name);
        expect(result.startTime).toBe(testTemplate.startTime);
        expect(result.endTime).toBe(testTemplate.endTime);
        expect(result.color).toBe(testTemplate.color);
    });
    it('获取所有班次模板', async () => {
        const template1 = await createShiftTemplate({
            name: `早班_${Date.now()}`,
            startTime: '08:00',
            endTime: '16:00',
            color: '#FF5733',
        });
        createdTemplates.push(template1.id);
        const template2 = await createShiftTemplate({
            name: `晚班_${Date.now()}`,
            startTime: '16:00',
            endTime: '24:00',
            color: '#3357FF',
        });
        createdTemplates.push(template2.id);
        const result = await findAllShiftTemplates();
        expect(result.length).toBeGreaterThanOrEqual(2);
    });
    it('根据 ID 获取班次模板', async () => {
        const testTemplate = {
            name: `早班_${Date.now()}`,
            startTime: '08:00',
            endTime: '16:00',
            color: '#FF5733',
            description: '标准早班',
        };
        const created = await createShiftTemplate(testTemplate);
        createdTemplates.push(created.id);
        const result = await findShiftTemplateById(created.id);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(created.id);
        expect(result?.name).toBe(testTemplate.name);
    });
    it('更新班次模板', async () => {
        const testTemplate = {
            name: `早班_${Date.now()}`,
            startTime: '08:00',
            endTime: '16:00',
            color: '#FF5733',
            description: '标准早班',
        };
        const created = await createShiftTemplate(testTemplate);
        createdTemplates.push(created.id);
        const updateData = { name: `早班-修改_${Date.now()}`, color: '#00FF00' };
        const result = await updateShiftTemplate(created.id, updateData);
        expect(result.name).toBe(updateData.name);
        expect(result.color).toBe(updateData.color);
    });
    it('删除无引用的班次模板成功', async () => {
        const testTemplate = {
            name: `早班_${Date.now()}`,
            startTime: '08:00',
            endTime: '16:00',
            color: '#FF5733',
            description: '标准早班',
        };
        const created = await createShiftTemplate(testTemplate);
        const result = await deleteShiftTemplate(created.id);
        expect(result).toBe(true);
        const deleted = await findShiftTemplateById(created.id);
        expect(deleted).toBeNull();
    });
    it('删除有排班引用的班次模板失败', async () => {
        const testTemplate = {
            name: `早班_${Date.now()}`,
            startTime: '08:00',
            endTime: '16:00',
            color: '#FF5733',
            description: '标准早班',
        };
        const template = await createShiftTemplate(testTemplate);
        createdTemplates.push(template.id);
        const employee = await prisma.employee.create({
            data: {
                name: '测试员工',
                employeeNo: `TEST_TEMPLATE_${Date.now()}`,
                phone: '13800138000',
                idCard: '110101199001011234',
                hireDate: new Date(),
            },
        });
        await prisma.schedule.create({
            data: {
                employeeId: employee.id,
                shiftTemplateId: template.id,
                date: new Date(),
            },
        });
        await expect(deleteShiftTemplate(template.id)).rejects.toThrow('该班次模板已被排班引用');
        await prisma.schedule.deleteMany({ where: { shiftTemplateId: template.id } });
        await prisma.employee.delete({ where: { id: employee.id } });
    });
});
//# sourceMappingURL=shift-template.service.test.js.map