export type RiskLevel = 'high' | 'medium' | 'low';

export type DriverStatus = 'online' | 'offline' | 'busy';

export type TempZone = 'frozen' | 'chilled' | 'controlled';

export type DisposalStatus = 'pending' | 'notified' | 'departed' | 'replenished' | 'verified';

export interface VehicleAlarm {
  id: string;
  plateNumber: string;
  route: string;
  shipper: string;
  tempZone: TempZone;
  currentTemp: number;
  targetTemp: number;
  overTempDuration: number;
  nearestColdPoint: string;
  distanceToColdPoint: number;
  driverName: string;
  driverStatus: DriverStatus;
  driverPhone: string;
  riskLevel: RiskLevel;
  riskScore: number;
  cargoDescription: string;
  alarmTime: string;
}

export interface AvailableResources {
  idleRefrigeratedTrucks: number;
  nearbyColdStorage: string[];
  dryIceStock: number;
  driverEtaMinutes: number;
}

export interface DisposalStep {
  id: string;
  type: 'driver' | 'shipper' | 'coldPoint';
  name: string;
  phone: string;
  role: string;
  status: DisposalStatus;
  updatedAt: string;
  remark?: string;
}

export interface DisposalOrder {
  id: string;
  vehicleId: string;
  plateNumber: string;
  route: string;
  shipper: string;
  createdAt: string;
  createdBy: string;
  overallStatus: DisposalStatus;
  steps: DisposalStep[];
  suggestion: string;
  resources: AvailableResources;
}

export interface RiskConfig {
  highThreshold: number;
  mediumThreshold: number;
}

export const tempZoneLabels: Record<TempZone, string> = {
  frozen: '冷冻',
  chilled: '冷藏',
  controlled: '恒温'
};

export const driverStatusLabels: Record<DriverStatus, string> = {
  online: '在线',
  offline: '离线',
  busy: '通话中'
};

export const disposalStatusLabels: Record<DisposalStatus, string> = {
  pending: '待通知',
  notified: '已通知',
  departed: '已出发',
  replenished: '已补冷',
  verified: '已复核'
};

export const riskLevelLabels: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险'
};
