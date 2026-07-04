import type { EmployeeCreate, EmployeeUpdate } from '@shared/schemas/employee.js';
export declare function createEmployee(data: EmployeeCreate): Promise<{
    employeePositions: {
        createdAt: Date;
        id: number;
        employeeId: number;
        updatedAt: Date;
        positionId: number;
        startDate: Date;
        endDate: Date | null;
    }[];
} & {
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.EmployeeStatus;
    employeeNo: string;
    phone: string;
    email: string | null;
    idCard: string;
    hireDate: Date;
    regularizeDate: Date | null;
    resignDate: Date | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    address: string | null;
    remark: string | null;
    supervisorId: number | null;
}>;
export declare function getEmployeeById(id: number): Promise<({
    employeePositions: ({
        position: {
            createdAt: Date;
            id: number;
            name: string;
            updatedAt: Date;
            deletedAt: Date | null;
            departmentId: number;
            rankId: number;
            headcount: number;
        };
    } & {
        createdAt: Date;
        id: number;
        employeeId: number;
        updatedAt: Date;
        positionId: number;
        startDate: Date;
        endDate: Date | null;
    })[];
} & {
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.EmployeeStatus;
    employeeNo: string;
    phone: string;
    email: string | null;
    idCard: string;
    hireDate: Date;
    regularizeDate: Date | null;
    resignDate: Date | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    address: string | null;
    remark: string | null;
    supervisorId: number | null;
}) | null>;
export declare function listEmployees(params: {
    page: number;
    pageSize: number;
    departmentId?: number;
    positionId?: number;
    status?: string;
    keyword?: string;
}): Promise<{
    list: {
        idCard: string;
        phone: string;
        employeePositions: ({
            position: {
                createdAt: Date;
                id: number;
                name: string;
                updatedAt: Date;
                deletedAt: Date | null;
                departmentId: number;
                rankId: number;
                headcount: number;
            };
        } & {
            createdAt: Date;
            id: number;
            employeeId: number;
            updatedAt: Date;
            positionId: number;
            startDate: Date;
            endDate: Date | null;
        })[];
        createdAt: Date;
        id: number;
        name: string;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.EmployeeStatus;
        employeeNo: string;
        email: string | null;
        hireDate: Date;
        regularizeDate: Date | null;
        resignDate: Date | null;
        emergencyContact: string | null;
        emergencyPhone: string | null;
        address: string | null;
        remark: string | null;
        supervisorId: number | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function updateEmployee(id: number, data: EmployeeUpdate): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.EmployeeStatus;
    employeeNo: string;
    phone: string;
    email: string | null;
    idCard: string;
    hireDate: Date;
    regularizeDate: Date | null;
    resignDate: Date | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    address: string | null;
    remark: string | null;
    supervisorId: number | null;
}>;
export declare function deleteEmployee(id: number): Promise<void>;
export declare function regularizeEmployee(id: number, regularizeDate: string): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.EmployeeStatus;
    employeeNo: string;
    phone: string;
    email: string | null;
    idCard: string;
    hireDate: Date;
    regularizeDate: Date | null;
    resignDate: Date | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    address: string | null;
    remark: string | null;
    supervisorId: number | null;
}>;
export declare function resignEmployee(id: number, resignDate: string, reason: string): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.EmployeeStatus;
    employeeNo: string;
    phone: string;
    email: string | null;
    idCard: string;
    hireDate: Date;
    regularizeDate: Date | null;
    resignDate: Date | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    address: string | null;
    remark: string | null;
    supervisorId: number | null;
}>;
//# sourceMappingURL=employee.service.d.ts.map