// 修改点：1. 移除未使用导入 2. 移除 form prop（BaseFormModal 管理） 3. 移除 schema prop（Arco Form 无此属性） 4. Input.Number→InputNumber 5. 移除内联 style
import { Form, Input, Select, DatePicker, Space, InputNumber } from '@arco-design/web-react';
import type { LeaveType, LeaveTimeHalf } from '@shop/shared';
import styles from './LeaveRequestForm.module.css';

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: 'ANNUAL', label: '年假' },
  { value: 'SICK', label: '病假' },
  { value: 'PERSONAL', label: '事假' },
  { value: 'COMPENSATORY', label: '调休' },
  { value: 'MARRIAGE', label: '婚假' },
  { value: 'MATERNITY', label: '产假' },
];

const TIME_HALF_OPTIONS: { value: LeaveTimeHalf; label: string }[] = [
  { value: 'AM', label: '上午' },
  { value: 'PM', label: '下午' },
  { value: 'ALL', label: '全天' },
];

function LeaveRequestForm() {
  return (
    <Space direction="vertical" size={16} className={styles.formWrap}>
      <Form.Item
        field="employeeId"
        label="员工ID"
        rules={[{ required: true, message: '请输入员工ID' }]}
      >
        <InputNumber
          placeholder="请输入员工ID"
          min={1}
          className={styles.fullWidth}
        />
      </Form.Item>

      <Form.Item
        field="type"
        label="请假类型"
        rules={[{ required: true, message: '请选择请假类型' }]}
      >
        <Select placeholder="请选择请假类型" className={styles.fullWidth}>
          {LEAVE_TYPE_OPTIONS.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Space direction="horizontal" size={16} className={styles.fullWidth}>
        <Form.Item
          field="startDate"
          label="开始日期"
          rules={[{ required: true, message: '请选择开始日期' }]}
          className={styles.flexItem}
        >
          <DatePicker placeholder="选择日期" className={styles.fullWidth} />
        </Form.Item>

        <Form.Item
          field="startTime"
          label="开始时段"
          rules={[{ required: true, message: '请选择开始时段' }]}
          className={styles.timeItem}
        >
          <Select placeholder="选择时段" className={styles.fullWidth}>
            {TIME_HALF_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Space>

      <Space direction="horizontal" size={16} className={styles.fullWidth}>
        <Form.Item
          field="endDate"
          label="结束日期"
          rules={[{ required: true, message: '请选择结束日期' }]}
          className={styles.flexItem}
        >
          <DatePicker placeholder="选择日期" className={styles.fullWidth} />
        </Form.Item>

        <Form.Item
          field="endTime"
          label="结束时段"
          rules={[{ required: true, message: '请选择结束时段' }]}
          className={styles.timeItem}
        >
          <Select placeholder="选择时段" className={styles.fullWidth}>
            {TIME_HALF_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Space>

      <Form.Item
        field="reason"
        label="请假原因"
        rules={[{ required: true, message: '请输入请假原因' }]}
      >
        <Input.TextArea
          placeholder="请输入请假原因"
          maxLength={500}
          rows={4}
          showWordLimit
        />
      </Form.Item>
    </Space>
  );
}

export default LeaveRequestForm;
