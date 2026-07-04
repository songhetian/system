# Taste Skill - 企业后台 React + Arco Design Pro 强制UI规范
# 所有代码生成、重构、修改必须100%遵守下方规则，违规代码直接驳回重写
# 配套开发文档 §6 设计理念，本文件为强制执行清单

# 视觉风格档位（适配后台稳重商务）
DESIGN_VARIANCE: 3
MOTION_INTENSITY: 2
VISUAL_DENSITY: 7

# 全局强制约束开关
RULE_FORCE_ALL: true
DISABLE_TAILWIND: true
DISABLE_OTHER_UI_LIB: true
DISABLE_GRADIENT: true
DISABLE_CUSTOM_RGBA_COLOR: true
DISABLE_CLASS_COMPONENT: true
DISABLE_ANY_TYPE: true
DISABLE_STYLED_COMPONENTS: true
DISABLE_RAW_CSS_FILE: true

# 1. 技术栈强制锁定
TECH_STACK:
  framework: React 18 + TypeScript Strict模式
  ui: @arco-design/web-react / Arco Design Pro 唯一组件库
  style: Arco Token + CSS Modules *.module.css
  icon: @arco-design/web-react/icon 仅官方图标
  globalState: Zustand
  serverState: TanStack React Query v5
  router: React Router v6 lazy load
  formValidate: Arco Form + Zod，全局类型存放 src/types
  dragCanvas: @xyflow/react 仅审批流使用
FORBIDDEN_IMPORT:
  - antd
  - element-plus
  - tailwindcss
  - styled-components
  - lodash（无特殊需求禁止）
  - 第三方图标库

# 2. 色彩强制规则
COLOR_RULE:
  baseTokenOnly: true # 禁止硬编码#色值、rgba、自定义渐变色
  primary: var(--color-primary-6) # #1677ff
  primaryLight: var(--color-fill-2) # #e8f3ff
  success: var(--color-success-6)
  warning: var(--color-warning-6)
  danger: var(--color-danger-6)
  text1: var(--color-text-1)
  text2: var(--color-text-2)
  text3: var(--color-text-3)
  border: var(--color-border-2)
  pageBg: var(--color-fill-1)
  darkMode: disable # 不生成暗黑模式相关代码

# 3. 间距、圆角、字体强制标准
SPACING_RULE:
  allowedToken: [4,8,16,24,32]
  pagePadding: 24px
  cardPadding: 16px
  forbidMagicNumberMargin: true # 禁止style={{margin:13}}魔法数字
  useArcoSpaceComponent: true
RADIUS_RULE:
  tagSmall: 4px
  inputButton: 6px
  cardTableModal: 8px
FONT_RULE:
  fontFamily: -apple-system, "Inter", "PingFang SC", "Microsoft YaHei", sans-serif
  fontSizeList: [12,14,16,18]
  lineHeight: 1.5
  fontWeightList: [400,500,600]
  forbidCustomLetterSpacing: true

# 4. 组件统一强制规范
COMPONENT_RULE:
  Form:
    labelCol: span:6, wrapperCol: span:18
    labelWidth: 120px 固定宽度，不自适应
    validateByZod: true
    submitDisabled: !formState.isValid || formState.isSubmitting
    footerOrder: 取消按钮居左，确认按钮居右
  Table:
    mustHas: 分页、序号列、右侧固定操作列200px
    dateColumnWidth: 160px
    statusColumnWidth: 100px
    emptyUseArcoDefault: true
    loadingBindQueryIsLoading: true
    rowSelection checkbox可选
  Modal:
    maskClosable: false # 表单弹窗禁止遮罩关闭
    widthRule: small=480 mid=640 large=900 xlarge=1200
    mustHaveTitle: true
    footerOrder: 取消左、确认右
    dangerDeleteUseModalConfirm: true
  Drawer:
    fixedRight: true
    width: 600px
    footer同Modal规则
  Button:
    type规范：primary主操作 / default次要 / danger危险操作
    文案格式：动词+名词（弹窗内可使用确定/取消）
    加载态绑定mutation.isMutating，文案不变
    纯图标按钮必须包裹Tooltip
  PageHeader:
    所有页面强制挂载，包含title+面包屑，路由格式：首页 > 模块 > 页面

# 5. 目录&文件命名规范
FILE_STRUCTURE_RULE:
  pageDir: src/features/{模块名kebab-case}/
  subFileStructure:
    index.tsx 页面入口
    components/ 业务子组件 PascalCase
    hooks/ useXxxList/useXxxMutate camelCase
    types.ts 页面局部类型，全局复用导入@/types
  namingRule:
    component: PascalCase
    hook: camelCase useXxx
    routePath: kebab-case
    apiPath: kebab-case
  styleFile: 仅允许 xxx.module.css，禁止裸css、内联style

# 6. Props & TypeScript 强制约束
TS_RULE:
  forbidAny: true
  allPropsValidateByZodSchema: true
  schemaImportFrom: "@/types" 优先复用全局Schema，禁止重复定义
  strictMode: true
  forbidImplicitAny: true

# 7. 全局通用组件复用强制（禁止重复手写）
BASE_COMPONENT_LIST:
  - @/components/BaseTable 统一封装表格
  - @/components/BaseRightDrawer 右侧详情抽屉
  - @/components/BaseFormModal Zod表单弹窗
  - @/components/BaseUploadExcel Excel导入
  - @/components/BaseFilePreview 文件预览kkFileView
  - @/components/BaseSalaryPwdModal 二级密码弹窗
  - @/components/BaseFlowCanvas 审批流画布
  - @/components/BaseScheduleCalendar 排班日历
RULE: 能使用基础组件必须优先复用，不满足需求则扩展基础组件，不页面内重复实现

# 8. 状态管理强制数据流
DATA_FLOW_RULE:
  服务端列表/详情数据：React Query
    queryKey格式：['模块','实体',筛选参数]
    staleTime规范：常规5分钟，排班1分钟，薪资0不缓存
    mutation成功自动invalidateQueries刷新列表
  全局UI状态：Zustand模块化store
  表单状态：Arco Form + Zod
  列表筛选参数：useSearchParams存入URL

# 9. 交互反馈统一标准
INTERACTION_RULE:
  成功提示：Message.success
  普通报错：Message.error
  删除/离职危险操作：Modal.confirm二次确认
  批量导入长任务：Notification.info + 轮询进度
  表单校验失败：自动滚动至第一个错误项
  三种状态必须处理：loading、empty空数据、error异常
  禁止自定义骨架屏、自定义loading动画，统一使用Arco内置Spin/Table loading

# 10. 全局禁用行为（生成代码直接规避）
FORBIDDEN_BEHAVIOR:
  - 硬编码色值、rgba、渐变、自定义色彩
  - margin/padding魔法数字、负边距
  - 引入Arco以外任何UI组件库
  - 非官方Arco图标、彩色图标
  - 自定义路由/弹窗过渡动效、hover缩放
  - 裸css文件、styled-components、大量内联style
  - class类组件、any类型、手写重复基础组件
  - 自定义loading/empty页面，替代Arco原生组件

# 输出校验规则
OUTPUT_CHECKLIST:
  生成代码完成后自动自检以下项，不满足则重新生成：
  1. 无硬编码色值，全部使用Arco CSS变量Token
  2. 间距使用Space组件或标准4/8/16/24/32，无魔法数字
  3. 图标仅来自@arco-design/web-react/icon
  4. 表单label固定120px，全部使用Zod校验
  5. 列表页面包含分页、序号、右侧固定操作列
  6. 弹窗/抽屉按钮顺序：取消左、确认右
  7. Props全部基于Zod类型，不存在any
  8. 样式采用CSS Modules，无内联style、裸css
  9. 优先复用项目内置Base通用组件，无重复实现
  10. 异步数据使用React Query，不使用useState+useEffect请求
  11. 完整处理loading、空数据、异常三种页面状态
