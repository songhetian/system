import type { WorkflowTemplateCreate, WorkflowTemplateUpdate, WorkflowInstanceCreate } from '@shop/shared';
interface WorkflowCallbacks {
    onApproved?: (sourceId: number, tx: any) => Promise<void>;
    onRejected?: (sourceId: number, tx: any, reason?: string) => Promise<void>;
}
export declare function registerWorkflowCallback(sourceType: string, cb: WorkflowCallbacks): void;
export declare function getWorkflowTemplateBySourceType(sourceType: string): Promise<{
    version: number;
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    sourceType: string | null;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.WorkflowTemplateStatus;
    nodes: import("@prisma/client/runtime/library").JsonValue;
    edges: import("@prisma/client/runtime/library").JsonValue;
} | null>;
export declare function createWorkflowTemplate(data: WorkflowTemplateCreate): Promise<{
    version: number;
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    sourceType: string | null;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.WorkflowTemplateStatus;
    nodes: import("@prisma/client/runtime/library").JsonValue;
    edges: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function getWorkflowTemplateById(id: number): Promise<{
    version: number;
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    sourceType: string | null;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.WorkflowTemplateStatus;
    nodes: import("@prisma/client/runtime/library").JsonValue;
    edges: import("@prisma/client/runtime/library").JsonValue;
} | null>;
export declare function listWorkflowTemplates(page: number, pageSize: number): Promise<{
    list: {
        version: number;
        description: string | null;
        createdAt: Date;
        id: number;
        name: string;
        sourceType: string | null;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.WorkflowTemplateStatus;
        nodes: import("@prisma/client/runtime/library").JsonValue;
        edges: import("@prisma/client/runtime/library").JsonValue;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function updateWorkflowTemplate(id: number, data: Partial<WorkflowTemplateUpdate>): Promise<{
    version: number;
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    sourceType: string | null;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.WorkflowTemplateStatus;
    nodes: import("@prisma/client/runtime/library").JsonValue;
    edges: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function deleteWorkflowTemplate(id: number): Promise<void>;
export declare function publishWorkflowTemplate(id: number): Promise<{
    version: number;
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    sourceType: string | null;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.WorkflowTemplateStatus;
    nodes: import("@prisma/client/runtime/library").JsonValue;
    edges: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function createWorkflowInstance(data: WorkflowInstanceCreate & {
    applicantId?: number;
}): Promise<{
    createdAt: Date;
    id: number;
    sourceType: string;
    sourceId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.WorkflowInstanceStatus;
    templateId: number;
    subject: string;
    formData: import("@prisma/client/runtime/library").JsonValue;
    applicantId: number;
    templateName: string;
    applicantName: string;
}>;
export declare function getWorkflowInstanceById(id: number): Promise<({
    nodes: {
        createdAt: Date;
        id: number;
        type: import("@prisma/client").$Enums.WorkflowNodeType;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApprovalNodeStatus;
        comment: string | null;
        label: string;
        assigneeName: string | null;
        operatedAt: Date | null;
        instanceId: number;
        conditionType: import("@prisma/client").$Enums.ConditionType | null;
        assigneeType: import("@prisma/client").$Enums.AssigneeType | null;
        assigneeId: number | null;
        signType: import("@prisma/client").$Enums.SignType | null;
        nodeIndex: number;
        conditionConfig: import("@prisma/client/runtime/library").JsonValue | null;
        returnedToIndex: number | null;
        returnedFromIndex: number | null;
    }[];
} & {
    createdAt: Date;
    id: number;
    sourceType: string;
    sourceId: number;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.WorkflowInstanceStatus;
    templateId: number;
    subject: string;
    formData: import("@prisma/client/runtime/library").JsonValue;
    applicantId: number;
    templateName: string;
    applicantName: string;
}) | null>;
export declare function listWorkflowInstances(page: number, pageSize: number): Promise<{
    list: {
        createdAt: Date;
        id: number;
        sourceType: string;
        sourceId: number;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.WorkflowInstanceStatus;
        templateId: number;
        subject: string;
        formData: import("@prisma/client/runtime/library").JsonValue;
        applicantId: number;
        templateName: string;
        applicantName: string;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function approveWorkflowInstance(id: number, comment: string): Promise<any>;
export declare function rejectWorkflowInstance(id: number, reason: string): Promise<any>;
export interface ConditionConfig {
    type: string;
    operator: string;
    value: any;
    field?: string;
}
export declare function evaluateCondition(formData: Record<string, any>, config: ConditionConfig, applicantId: number): Promise<boolean>;
export declare function returnWorkflowInstance(id: number, targetType: 'PREVIOUS' | 'START' | 'SPECIFIED', reason: string, targetNodeIndex?: number): Promise<any>;
export {};
//# sourceMappingURL=workflow.service.d.ts.map