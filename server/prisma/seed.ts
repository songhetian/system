import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始执行种子数据初始化...\n");

  // ═══════════════════ 1. 默认部门 ═══════════════════
  const dept = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "总公司",
      sortOrder: 0,
    },
  });
  console.log(`✅ 部门: ${dept.name}`);

  // ═══════════════════ 2. 默认职级 ═══════════════════
  const rank = await prisma.rank.upsert({
    where: { level: 1 },
    update: {},
    create: {
      id: 1,
      name: "管理员",
      level: 1,
    },
  });
  console.log(`✅ 职级: ${rank.name}`);

  // ═══════════════════ 3. 默认岗位 ═══════════════════
  const position = await prisma.position.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "系统管理员",
      departmentId: dept.id,
      rankId: rank.id,
      headcount: 1,
      deletedAt: null,
    },
  });
  console.log(`✅ 岗位: ${position.name}`);

  // ═══════════════════ 4. 管理员员工 ═══════════════════
  const employee = await prisma.employee.upsert({
    where: { employeeNo: "ADMIN001" },
    update: {},
    create: {
      id: 1,
      name: "系统管理员",
      employeeNo: "ADMIN001",
      phone: "13800000000",
      email: "admin@company.com",
      idCard: "000000000000000000",
      hireDate: new Date("2020-01-01"),
      regularizeDate: new Date("2020-01-01"),
      status: "ACTIVE",
      deletedAt: null,
    },
  });
  console.log(`✅ 员工: ${employee.name} (${employee.employeeNo})`);

  // 关联岗位
  await prisma.employeePosition.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      employeeId: employee.id,
      positionId: position.id,
      startDate: new Date("2020-01-01"),
    },
  });
  console.log("✅ 员工-岗位关联");

  // ═══════════════════ 5. 超级管理员用户 ═══════════════════
  const passwordHash = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      id: 1,
      username: "admin",
      passwordHash,
      employeeId: employee.id,
      loginFailCount: 0,
      deletedAt: null,
    },
  });
  console.log(`✅ 用户: ${user.username} (密码: admin123)`);

  // ═══════════════════ 6. 权限项 ═══════════════════

  const permissions = [
    // 通用
    { code: "dashboard:view", name: "查看仪表盘", group: "通用" },

    // 组织架构
    { code: "department:read", name: "查看部门", group: "组织架构" },
    { code: "department:create", name: "创建部门", group: "组织架构" },
    { code: "department:update", name: "编辑部门", group: "组织架构" },
    { code: "department:delete", name: "删除部门", group: "组织架构" },

    // 岗位
    { code: "position:read", name: "查看岗位", group: "组织架构" },
    { code: "position:create", name: "创建岗位", group: "组织架构" },
    { code: "position:update", name: "编辑岗位", group: "组织架构" },
    { code: "position:delete", name: "删除岗位", group: "组织架构" },

    // 职级
    { code: "rank:read", name: "查看职级", group: "组织架构" },
    { code: "rank:create", name: "创建职级", group: "组织架构" },
    { code: "rank:update", name: "编辑职级", group: "组织架构" },
    { code: "rank:delete", name: "删除职级", group: "组织架构" },

    // 人员管理
    { code: "employee:read", name: "查看员工", group: "人员管理" },
    { code: "employee:create", name: "创建员工", group: "人员管理" },
    { code: "employee:update", name: "编辑员工", group: "人员管理" },
    { code: "employee:delete", name: "删除员工", group: "人员管理" },
    { code: "employee:import", name: "批量导入员工", group: "人员管理" },
    { code: "employee:export", name: "导出员工", group: "人员管理" },
    { code: "employee:archive", name: "查看员工档案", group: "人员管理" },

    // 权限管理
    { code: "role:read", name: "查看角色", group: "权限管理" },
    { code: "role:create", name: "创建角色", group: "权限管理" },
    { code: "role:update", name: "编辑角色", group: "权限管理" },
    { code: "role:delete", name: "删除角色", group: "权限管理" },
    { code: "permission:read", name: "查看权限", group: "权限管理" },
    { code: "user:manage", name: "管理用户", group: "权限管理" },

    // 排班
    { code: "schedule:read", name: "查看排班", group: "排班管理" },
    { code: "schedule:create", name: "创建排班", group: "排班管理" },
    { code: "schedule:update", name: "编辑排班", group: "排班管理" },
    { code: "schedule:delete", name: "删除排班", group: "排班管理" },
    { code: "schedule:generate", name: "生成排班", group: "排班管理" },
    { code: "schedule:export", name: "导出排班", group: "排班管理" },

    // 考勤
    { code: "attendance:read", name: "查看考勤", group: "考勤管理" },
    { code: "attendance:clock", name: "打卡", group: "考勤管理" },
    { code: "attendance:summary", name: "查看考勤台账", group: "考勤管理" },
    { code: "attendance:generate", name: "生成台账", group: "考勤管理" },
    { code: "attendance:lock", name: "锁定台账", group: "考勤管理" },
    { code: "attendance:export", name: "导出考勤", group: "考勤管理" },

    // 假期
    { code: "leave:read", name: "查看请假", group: "假期管理" },
    { code: "leave:create", name: "申请请假", group: "假期管理" },
    { code: "leave:approve", name: "审批请假", group: "假期管理" },
    { code: "leave:cancel", name: "撤销请假", group: "假期管理" },
    { code: "leave:quota:read", name: "查看假期额度", group: "假期管理" },
    { code: "leave:quota:init", name: "初始化假期额度", group: "假期管理" },
    { code: "leave:export", name: "导出假期", group: "假期管理" },

    // 加班
    { code: "overtime:read", name: "查看加班", group: "加班管理" },
    { code: "overtime:create", name: "申请加班", group: "加班管理" },
    { code: "overtime:approve", name: "审批加班", group: "加班管理" },

    // 薪资
    { code: "salary:view", name: "查看薪资", group: "薪资管理" },
    { code: "salary:export", name: "导出薪资", group: "薪资管理" },
    { code: "salary:structure:read", name: "查看薪资结构", group: "薪资管理" },
    { code: "salary:structure:create", name: "创建薪资结构", group: "薪资管理" },
    { code: "salary:structure:update", name: "编辑薪资结构", group: "薪资管理" },
    { code: "salary:structure:assign", name: "分配薪资结构", group: "薪资管理" },
    { code: "salary:generate", name: "生成工资条", group: "薪资管理" },
    { code: "salary:audit:read", name: "查看薪资审计", group: "薪资管理" },

    // 报销
    { code: "expense:read", name: "查看报销", group: "报销管理" },
    { code: "expense:create", name: "创建报销", group: "报销管理" },
    { code: "expense:update", name: "编辑报销", group: "报销管理" },
    { code: "expense:delete", name: "删除报销", group: "报销管理" },
    { code: "expense:export", name: "导出报销", group: "报销管理" },

    // 培训
    { code: "training:read", name: "查看培训", group: "培训管理" },
    { code: "training:create", name: "创建培训", group: "培训管理" },
    { code: "training:update", name: "编辑培训", group: "培训管理" },
    { code: "training:delete", name: "删除培训", group: "培训管理" },
    { code: "training:enroll", name: "报名培训", group: "培训管理" },

    // 知识库
    { code: "kb:read", name: "查看知识库", group: "知识库" },
    { code: "kb:upload", name: "上传文档", group: "知识库" },
    { code: "kb:delete", name: "删除文档", group: "知识库" },
    { code: "kb:download", name: "下载文档", group: "知识库" },

    // 审批流
    { code: "workflow:template:read", name: "查看流程模板", group: "审批管理" },
    { code: "workflow:template:create", name: "创建流程模板", group: "审批管理" },
    { code: "workflow:template:update", name: "编辑流程模板", group: "审批管理" },
    { code: "workflow:template:delete", name: "删除流程模板", group: "审批管理" },
    { code: "workflow:template:deploy", name: "发布流程模板", group: "审批管理" },
    { code: "workflow:instance:read", name: "查看审批实例", group: "审批管理" },
    { code: "workflow:instance:approve", name: "审批", group: "审批管理" },
    { code: "workflow:instance:reject", name: "驳回", group: "审批管理" },
    { code: "workflow:instance:cancel", name: "撤销审批", group: "审批管理" },

    // 消息公告
    { code: "message:read", name: "查看消息", group: "消息公告" },
    { code: "announcement:read", name: "查看公告", group: "消息公告" },
    { code: "announcement:create", name: "创建公告", group: "消息公告" },
    { code: "announcement:update", name: "编辑公告", group: "消息公告" },
    { code: "announcement:delete", name: "删除公告", group: "消息公告" },
    { code: "announcement:publish", name: "发布公告", group: "消息公告" },

    // Excel
    { code: "excel:import", name: "导入Excel", group: "Excel管理" },
    { code: "excel:export", name: "导出Excel", group: "Excel管理" },
    { code: "excel:template", name: "下载导入模板", group: "Excel管理" },

    // 系统管理
    { code: "audit:view", name: "查看操作日志", group: "系统管理" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, group: perm.group },
      create: perm,
    });
  }
  console.log(`✅ 权限: ${permissions.length} 项全部同步`);

  // ═══════════════════ 7. 超级管理员角色 ═══════════════════
  const role = await prisma.role.upsert({
    where: { code: "super_admin" },
    update: {},
    create: {
      id: 1,
      name: "超级管理员",
      code: "super_admin",
      description: "系统最高权限，拥有所有菜单和操作权限",
      deletedAt: null,
    },
  });
  console.log(`✅ 角色: ${role.name}`);

  // ═══════════════════ 8. 角色-权限绑定 ═══════════════════
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
  }
  console.log(`✅ 角色-权限: ${allPermissions.length} 项绑定`);

  // ═══════════════════ 9. 用户-角色绑定 ═══════════════════
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  console.log(`✅ 用户-角色: admin → 超级管理员`);

  console.log("\n🎉 种子数据初始化完成！");
  console.log("   登录账号: admin / admin123\n");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据执行失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
