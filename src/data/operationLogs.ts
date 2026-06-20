import type { OperationLog } from '@/types';

export const operationLogs: OperationLog[] = [
  {
    id: 'log_000',
    orderId: 'D20260621001',
    type: 'generate_plan',
    description: '生成处置方案：高风险告警，优先联系司机确认情况，...',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 08:44:00',
    detail:
      '高风险告警，优先联系司机确认情况，同步补冷点准备资源，最后通知货主避免投诉。建议立即启动应急预案，司机20分钟内无法修复则安排转货。'
  },
  {
    id: 'log_001',
    orderId: 'D20260621001',
    type: 'create_order',
    description: '创建处置单，共 3 个处置步骤',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 08:45:00',
    detail: '高风险告警，立即启动应急预案'
  },
  {
    id: 'log_002',
    orderId: 'D20260621001',
    type: 'update_step',
    description: '补冷点 嘉兴冷链站 状态更新为「已通知」',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 08:50:00',
    detail: '已通知做好接车准备'
  },
  {
    id: 'log_003',
    orderId: 'D20260621001',
    type: 'update_step',
    description: '货主 顺丰冷链-李经理 状态更新为「已通知」',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 09:00:00',
    detail: '已告知超温情况，货主表示理解'
  },
  {
    id: 'log_004',
    orderId: 'D20260621001',
    type: 'update_step',
    description: '驾驶员 张师傅 状态更新为「已出发」',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 09:10:00',
    detail: '已确认车辆制冷机组故障，正开往嘉兴补冷'
  },
  {
    id: 'log_005',
    orderId: 'D20260621002',
    type: 'generate_plan',
    description: '生成处置方案：【关注】中风险告警，建议按流程处理。...',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 09:59:00',
    detail: '【关注】中风险告警，建议按流程处理。'
  },
  {
    id: 'log_006',
    orderId: 'D20260621002',
    type: 'create_order',
    description: '创建处置单，共 3 个处置步骤',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 10:00:00',
    detail: '中风险告警，按流程处理'
  },
  {
    id: 'log_007',
    orderId: 'D20260621002',
    type: 'update_step',
    description: '驾驶员 王师傅 状态更新为「已补冷」',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 10:45:00',
    detail: '已到达台州冷藏站，正在补冷'
  },
  {
    id: 'log_008',
    orderId: 'D20260621002',
    type: 'update_step',
    description: '补冷点 台州冷藏站 状态更新为「已补冷」',
    operator: '调度员小王',
    shift: 'day',
    timestamp: '2026-06-21 10:50:00',
    detail: '车辆已进站补冷'
  },
  {
    id: 'log_009',
    orderId: 'D20260621003',
    type: 'generate_plan',
    description: '生成处置方案：【关注】中风险告警，建议按流程处理。注意医药...',
    operator: '调度员小李',
    shift: 'night',
    timestamp: '2026-06-21 22:29:00',
    detail: '【关注】中风险告警，建议按流程处理。注意医药试剂温度敏感。'
  },
  {
    id: 'log_010',
    orderId: 'D20260621003',
    type: 'create_order',
    description: '创建处置单，共 3 个处置步骤',
    operator: '调度员小李',
    shift: 'night',
    timestamp: '2026-06-21 22:30:00',
    detail: '中风险告警，注意医药试剂温度敏感'
  },
  {
    id: 'log_011',
    orderId: 'D20260621003',
    type: 'update_step',
    description: '驾驶员 刘师傅 状态更新为「已通知」',
    operator: '调度员小李',
    shift: 'night',
    timestamp: '2026-06-21 22:35:00',
    detail: '司机表示正在检查，温度缓慢上升'
  },
  {
    id: 'log_012',
    orderId: 'D20260620008',
    type: 'generate_plan',
    description: '生成处置方案：【常规】低风险告警，建议常规处理。...',
    operator: '调度员小赵',
    shift: 'night',
    timestamp: '2026-06-20 21:19:00',
    detail: '【常规】低风险告警，建议常规处理。'
  },
  {
    id: 'log_013',
    orderId: 'D20260620008',
    type: 'create_order',
    description: '创建处置单，共 3 个处置步骤',
    operator: '调度员小赵',
    shift: 'night',
    timestamp: '2026-06-20 21:20:00',
    detail: '低风险告警，常规处理'
  },
  {
    id: 'log_014',
    orderId: 'D20260620008',
    type: 'update_step',
    description: '货主 极兔冷链-陈经理 状态更新为「已复核」',
    operator: '调度员小赵',
    shift: 'night',
    timestamp: '2026-06-20 21:30:00',
    detail: '已通知并说明情况'
  },
  {
    id: 'log_015',
    orderId: 'D20260620008',
    type: 'update_step',
    description: '补冷点 义乌冷库 状态更新为「已复核」',
    operator: '调度员小赵',
    shift: 'night',
    timestamp: '2026-06-20 22:00:00',
    detail: '已取消预约'
  },
  {
    id: 'log_016',
    orderId: 'D20260620008',
    type: 'update_step',
    description: '驾驶员 周师傅 状态更新为「已复核」',
    operator: '调度员小赵',
    shift: 'night',
    timestamp: '2026-06-20 22:30:00',
    detail: '温度已恢复正常，继续运输'
  }
];
