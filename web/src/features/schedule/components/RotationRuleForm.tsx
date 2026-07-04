/*
 * 修改点：
 * 1. 移除 Form.Item 的 schema prop（Arco Form 不支持）
 * 2. 移除未使用的 Button、Message、IconPlus、IconDelete 导入
 * 3. 移除未使用的 isEdit prop
 * 4. 移除未使用的 shiftTemplateMap 变量
 * 5. 内联 style → CSS module
 * 6. 硬编码色值 #4e5969、#86909c → var(--color-text-2/3)
 * 7. zod schema 从 .shape 访问改为直接使用 rules
 */
import { Form, Input, InputNumber, Select, Space } from '@arco-design/web-react';
import { useState, useEffect } from 'react';
import type { RotationPattern, ShiftTemplate } from '@shop/shared';
import { useShiftTemplateList } from '../hooks/useSchedule';
import styles from './RotationRuleForm.module.css';

type Props = {
  form: any;
};

function RotationRuleForm({ form }: Props) {
  const { data: shiftTemplates = [] } = useShiftTemplateList();
  const [cycleDays, setCycleDays] = useState(7);
  const [patterns, setPatterns] = useState<RotationPattern[]>([]);

  useEffect(() => {
    const initial: RotationPattern[] = [];
    for (let i = 0; i < cycleDays; i++) {
      initial.push({ dayOffset: i, shiftTemplateId: 0 });
    }
    setPatterns(initial);
  }, [cycleDays]);

  const handlePatternChange = (index: number, shiftTemplateId: number) => {
    const newPatterns = [...patterns];
    newPatterns[index] = { ...newPatterns[index], shiftTemplateId };
    setPatterns(newPatterns);
    form.setFieldsValue({ pattern: newPatterns });
  };

  const getDayName = (offset: number) => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days[offset % 7];
  };

  return (
    <Space direction="vertical" size={16} className={styles.formWrap}>
      <Form.Item
        field="name"
        label="规则名称"
        rules={[{ required: true, message: '请输入规则名称' }]}
      >
        <Input placeholder="请输入规则名称" maxLength={50} />
      </Form.Item>

      <Form.Item
        field="cycleDays"
        label="周期天数"
        rules={[{ required: true, message: '请输入周期天数' }]}
      >
        <InputNumber
          min={1}
          max={31}
          className={styles.fullWidth}
          value={cycleDays}
          onChange={(val) => setCycleDays(val || 1)}
        />
      </Form.Item>

      <Form.Item
        field="pattern"
        label="班次模式"
        rules={[{ required: true, message: '请配置班次模式' }]}
      >
        <Space direction="vertical" size={8} className={styles.fullWidth}>
          {patterns.map((p, index) => (
            <Space key={index} size={8} className={styles.fullWidth}>
              <span className={styles.dayLabel}>
                {getDayName(p.dayOffset)}
              </span>
              <Select
                placeholder="选择班次"
                className={styles.selectFlex}
                value={p.shiftTemplateId || undefined}
                onChange={(val) => handlePatternChange(index, val as number)}
                allowClear
              >
                {(shiftTemplates as ShiftTemplate[]).map((t) => (
                  <Select.Option key={t.id} value={t.id}>
                    <Space size={8}>
                      <span
                        className={styles.colorDot}
                        style={{ backgroundColor: t.color }}
                      />
                      <span>{t.name}</span>
                      <span className={styles.timeText}>
                        {t.startTime}-{t.endTime}
                      </span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Space>
          ))}
          {(shiftTemplates as ShiftTemplate[]).length === 0 && (
            <div className={styles.emptyText}>
              暂无班次模板，请先创建班次模板
            </div>
          )}
        </Space>
      </Form.Item>
    </Space>
  );
}

export default RotationRuleForm;
