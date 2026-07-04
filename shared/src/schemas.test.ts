import { describe, it, expect } from "vitest";
import {
  zDepartmentCreate,
  zEmployeeCreate,
  zLoginInput,
  zLeaveRequestCreate,
} from "./index";

describe("shared schemas", () => {
  it("validates department create with valid data", () => {
    const result = zDepartmentCreate.safeParse({
      name: "技术部",
      parentId: null,
      sortOrder: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects department create with empty name", () => {
    const result = zDepartmentCreate.safeParse({
      name: "",
      parentId: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("validates employee create with complete data", () => {
    const result = zEmployeeCreate.safeParse({
      name: "张三",
      employeeNo: "EMP001",
      phone: "13800138000",
      email: "zhangsan@example.com",
      idCard: "310101199001011234",
      hireDate: "2026-01-01",
      departmentId: 1,
      positionIds: [1],
    });
    expect(result.success).toBe(true);
  });

  it("rejects employee create with invalid phone", () => {
    const result = zEmployeeCreate.safeParse({
      name: "张三",
      employeeNo: "EMP001",
      phone: "12345",
      idCard: "310101199001011234",
      hireDate: "2026-01-01",
      departmentId: 1,
      positionIds: [1],
    });
    expect(result.success).toBe(false);
  });

  it("validates login input", () => {
    const result = zLoginInput.safeParse({
      username: "admin",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("validates leave request with cross-field rules", () => {
    const result = zLeaveRequestCreate.safeParse({
      employeeId: 1,
      type: "ANNUAL",
      startDate: "2026-07-06",
      endDate: "2026-07-05",
      startTime: "AM",
      endTime: "PM",
      reason: "个人原因",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("结束日期"))).toBe(true);
    }
  });

  it("requires attachments for marriage leave", () => {
    const result = zLeaveRequestCreate.safeParse({
      employeeId: 1,
      type: "MARRIAGE",
      startDate: "2026-07-10",
      endDate: "2026-07-15",
      startTime: "ALL",
      endTime: "ALL",
      reason: "婚假",
      attachments: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("证明材料"))).toBe(true);
    }
  });
});
