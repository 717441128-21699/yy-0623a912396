import type { DisposalOrder } from '@/types';

export const disposalList: DisposalOrder[] = [
  {
    id: 'D20260621001',
    vehicleId: '1',
    plateNumber: '沪A·D8526',
    route: '上海→杭州',
    shipper: '顺丰冷链',
    createdAt: '2026-06-21 08:45:00',
    createdBy: '调度员小王',
    shift: 'day',
    overallStatus: 'departed',
    suggestion: '【紧急】高风险告警，建议立即启动应急预案。立即协调最近补冷点。',
    resources: {
      idleRefrigeratedTrucks: 2,
      nearbyColdStorage: ['嘉兴冷链站'],
      dryIceStock: 50,
      driverEtaMinutes: 30
    },
    steps: [
      {
        id: 's1',
        type: 'driver',
        name: '张师傅',
        phone: '13800138001',
        role: '驾驶员',
        status: 'departed',
        updatedAt: '2026-06-21 09:10:00',
        remark: '已确认车辆制冷机组故障，正开往嘉兴补冷'
      },
      {
        id: 's2',
        type: 'coldPoint',
        name: '嘉兴冷链站',
        phone: '0573-88888888',
        role: '补冷点',
        status: 'notified',
        updatedAt: '2026-06-21 08:50:00',
        remark: '已通知做好接车准备'
      },
      {
        id: 's3',
        type: 'shipper',
        name: '顺丰冷链-李经理',
        phone: '021-12345678',
        role: '货主',
        status: 'notified',
        updatedAt: '2026-06-21 09:00:00',
        remark: '已告知超温情况，货主表示理解'
      }
    ]
  },
  {
    id: 'D20260621002',
    vehicleId: '3',
    plateNumber: '浙C·H7720',
    route: '温州→宁波',
    shipper: '极兔冷链',
    createdAt: '2026-06-21 10:00:00',
    createdBy: '调度员小王',
    shift: 'day',
    overallStatus: 'replenished',
    suggestion: '【关注】中风险告警，建议按流程处理。',
    resources: {
      idleRefrigeratedTrucks: 1,
      nearbyColdStorage: ['台州冷藏站'],
      dryIceStock: 30,
      driverEtaMinutes: 45
    },
    steps: [
      {
        id: 's1',
        type: 'driver',
        name: '王师傅',
        phone: '13700137003',
        role: '驾驶员',
        status: 'replenished',
        updatedAt: '2026-06-21 10:45:00',
        remark: '已到达台州冷藏站，正在补冷'
      },
      {
        id: 's2',
        type: 'coldPoint',
        name: '台州冷藏站',
        phone: '0576-66666666',
        role: '补冷点',
        status: 'replenished',
        updatedAt: '2026-06-21 10:50:00',
        remark: '车辆已进站补冷'
      },
      {
        id: 's3',
        type: 'shipper',
        name: '极兔冷链-王经理',
        phone: '0577-22222222',
        role: '货主',
        status: 'notified',
        updatedAt: '2026-06-21 10:15:00',
        remark: '已通知，货主要求持续跟进'
      }
    ]
  },
  {
    id: 'D20260621003',
    vehicleId: '5',
    plateNumber: '皖A·D4428',
    route: '合肥→上海',
    shipper: '中通冷链',
    createdAt: '2026-06-21 22:30:00',
    createdBy: '调度员小李',
    shift: 'night',
    overallStatus: 'notified',
    suggestion: '【关注】中风险告警，建议按流程处理。注意医药试剂温度敏感。',
    resources: {
      idleRefrigeratedTrucks: 0,
      nearbyColdStorage: ['芜湖冷库'],
      dryIceStock: 20,
      driverEtaMinutes: 60
    },
    steps: [
      {
        id: 's1',
        type: 'driver',
        name: '刘师傅',
        phone: '13500135005',
        role: '驾驶员',
        status: 'notified',
        updatedAt: '2026-06-21 10:35:00',
        remark: '司机表示正在检查，温度缓慢上升'
      },
      {
        id: 's2',
        type: 'coldPoint',
        name: '芜湖冷库',
        phone: '0553-77777777',
        role: '补冷点',
        status: 'pending',
        updatedAt: '2026-06-21 10:30:00'
      },
      {
        id: 's3',
        type: 'shipper',
        name: '中通冷链-张经理',
        phone: '0551-99999999',
        role: '货主',
        status: 'pending',
        updatedAt: '2026-06-21 10:30:00'
      }
    ]
  },
  {
    id: 'D20260620008',
    vehicleId: '8',
    plateNumber: '浙A·M2234',
    route: '杭州→金华',
    shipper: '极兔冷链',
    createdAt: '2026-06-20 21:20:00',
    createdBy: '调度员小赵',
    shift: 'night',
    overallStatus: 'verified',
    suggestion: '【常规】低风险告警，建议常规处理。',
    resources: {
      idleRefrigeratedTrucks: 3,
      nearbyColdStorage: ['义乌冷库'],
      dryIceStock: 80,
      driverEtaMinutes: 20
    },
    steps: [
      {
        id: 's1',
        type: 'driver',
        name: '周师傅',
        phone: '13200132008',
        role: '驾驶员',
        status: 'verified',
        updatedAt: '2026-06-20 18:00:00',
        remark: '温度已恢复正常，继续运输'
      },
      {
        id: 's2',
        type: 'coldPoint',
        name: '义乌冷库',
        phone: '0579-33333333',
        role: '补冷点',
        status: 'verified',
        updatedAt: '2026-06-20 17:30:00',
        remark: '已取消预约'
      },
      {
        id: 's3',
        type: 'shipper',
        name: '极兔冷链-陈经理',
        phone: '0571-55555555',
        role: '货主',
        status: 'verified',
        updatedAt: '2026-06-20 17:00:00',
        remark: '已通知并说明情况'
      }
    ]
  }
];
