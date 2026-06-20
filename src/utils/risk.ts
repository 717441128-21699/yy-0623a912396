import type { VehicleAlarm, RiskLevel } from '@/types';

export function calculateRiskScore(alarm: VehicleAlarm): number {
  let score = 0;

  const tempDiff = alarm.currentTemp - alarm.targetTemp;
  score += tempDiff * 10;

  score += alarm.overTempDuration / 60;

  if (alarm.tempZone === 'frozen') {
    score *= 1.5;
  } else if (alarm.tempZone === 'chilled') {
    score *= 1.2;
  }

  score += (50 - Math.min(alarm.distanceToColdPoint, 50)) / 5;

  if (alarm.driverStatus === 'offline') {
    score += 20;
  } else if (alarm.driverStatus === 'busy') {
    score += 10;
  }

  return Math.round(score);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function sortAlarmsByRisk(alarms: VehicleAlarm[]): VehicleAlarm[] {
  return [...alarms].sort((a, b) => b.riskScore - a.riskScore);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分`;
}

export function generateSuggestedScript(type: 'driver' | 'shipper' | 'coldPoint', info: {
  plateNumber: string;
  route: string;
  tempZone: string;
  duration: string;
}): string {
  const scripts = {
    driver: `您好，我是调度中心。您驾驶的${info.plateNumber}（${info.route}线路）${info.tempZone}货厢已超温${info.duration}，请立即检查制冷机组，尽快前往就近补冷点补冷。收到请回复。`,
    shipper: `您好，${info.shipper ? '' : '货主方'}，您委托运输的${info.plateNumber}车辆（${info.route}线路）出现超温告警，已超温${info.duration}，我们正在紧急调度处理，后续进展会及时同步。`,
    coldPoint: `您好，${info.plateNumber}冷链车（${info.route}线路）需紧急补冷，预计${Math.round(info.duration ? 30 : 30)}分钟后到达，请做好接车准备。`
  };
  return scripts[type];
}

export function generateDisposalPlan(alarm: VehicleAlarm, resources: {
  idleRefrigeratedTrucks: number;
  nearbyColdStorage: string[];
  dryIceStock: number;
  driverEtaMinutes: number;
}): { priority: string[]; suggestion: string } {
  const priority: string[] = [];
  let suggestion = '';

  if (alarm.driverStatus === 'online') {
    priority.push('driver');
  }

  if (resources.nearbyColdStorage.length > 0) {
    priority.push('coldPoint');
  }

  priority.push('shipper');

  const score = alarm.riskScore;

  if (score >= 80) {
    suggestion = `【紧急】高风险告警，建议立即启动应急预案：\n1. 第一时间联系司机确认现场情况\n2. 同步通知货主超温风险\n3. 立即协调最近补冷点（${alarm.nearestColdPoint}，${alarm.distanceToColdPoint}公里）\n4. 若干冰库存充足，可考虑送干冰应急\n5. 若${resources.idleRefrigeratedTrucks > 0 ? '有空闲冷藏车，建议' : '暂无空闲车辆，建议'}评估是否需要转运`;
  } else if (score >= 40) {
    suggestion = `【关注】中风险告警，建议按流程处理：\n1. 联系司机检查制冷设备\n2. 通知就近补冷点（${alarm.nearestColdPoint}）待命\n3. 货主方同步情况\n4. 持续监控温度变化`;
  } else {
    suggestion = `【常规】低风险告警，建议常规处理：\n1. 联系司机确认情况\n2. 告知司机关注温度变化\n3. 记录告警，持续观察`;
  }

  return { priority, suggestion };
}
