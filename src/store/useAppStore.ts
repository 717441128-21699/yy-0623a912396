import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  VehicleAlarm,
  DisposalOrder,
  DisposalStatus,
  DisposalStep,
  ShiftType,
  ResourceTemplate,
  OperationLog,
  OperationType
} from '@/types';
import { alarmList as mockAlarmList } from '@/data/alarmList';
import { disposalList as mockDisposalList } from '@/data/disposalList';
import { operationLogs as mockOperationLogs } from '@/data/operationLogs';

const STORAGE_KEY_DISPOSAL = 'cold_chain_disposal_orders';
const STORAGE_KEY_SHIFT = 'cold_chain_current_shift';
const STORAGE_KEY_TEMPLATES = 'cold_chain_resource_templates';
const STORAGE_KEY_LOGS = 'cold_chain_operation_logs';

function loadDisposalOrders(): DisposalOrder[] {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_DISPOSAL);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored as DisposalOrder[];
    }
  } catch (e) {
    console.error('[Store] 读取本地处置单失败:', e);
  }
  return mockDisposalList;
}

function saveDisposalOrders(orders: DisposalOrder[]) {
  try {
    Taro.setStorageSync(STORAGE_KEY_DISPOSAL, orders);
  } catch (e) {
    console.error('[Store] 保存本地处置单失败:', e);
  }
}

function loadShift(): ShiftType {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_SHIFT);
    if (stored === 'day' || stored === 'night') return stored;
  } catch (e) {
    console.error('[Store] 读取班次失败:', e);
  }
  const hour = new Date().getHours();
  return hour >= 8 && hour < 20 ? 'day' : 'night';
}

function saveShift(shift: ShiftType) {
  try {
    Taro.setStorageSync(STORAGE_KEY_SHIFT, shift);
  } catch (e) {
    console.error('[Store] 保存班次失败:', e);
  }
}

function loadTemplates(): ResourceTemplate[] {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_TEMPLATES);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored as ResourceTemplate[];
    }
  } catch (e) {
    console.error('[Store] 读取资源模板失败:', e);
  }
  return [];
}

function saveTemplates(templates: ResourceTemplate[]) {
  try {
    Taro.setStorageSync(STORAGE_KEY_TEMPLATES, templates);
  } catch (e) {
    console.error('[Store] 保存资源模板失败:', e);
  }
}

function loadLogs(): OperationLog[] {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_LOGS);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored as OperationLog[];
    }
  } catch (e) {
    console.error('[Store] 读取操作日志失败:', e);
  }
  return mockOperationLogs;
}

function saveLogs(logs: OperationLog[]) {
  try {
    Taro.setStorageSync(STORAGE_KEY_LOGS, logs);
  } catch (e) {
    console.error('[Store] 保存操作日志失败:', e);
  }
}

function computeOverallStatus(steps: DisposalStep[]): DisposalStatus {
  const allVerified = steps.every((s) => s.status === 'verified');
  const allReplenished = steps.every(
    (s) => s.status === 'replenished' || s.status === 'verified'
  );
  const anyDeparted = steps.some(
    (s) => s.status === 'departed' || s.status === 'replenished' || s.status === 'verified'
  );
  const anyNotified = steps.some(
    (s) =>
      s.status === 'notified' ||
      s.status === 'departed' ||
      s.status === 'replenished' ||
      s.status === 'verified'
  );

  if (allVerified) return 'verified';
  if (allReplenished) return 'replenished';
  if (anyDeparted) return 'departed';
  if (anyNotified) return 'notified';
  return 'pending';
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface AppState {
  alarms: VehicleAlarm[];
  disposalOrders: DisposalOrder[];
  currentDispatcher: string;
  currentShift: ShiftType;
  resourceTemplates: ResourceTemplate[];
  operationLogs: OperationLog[];

  setShift: (shift: ShiftType) => void;
  addDisposalOrder: (order: DisposalOrder) => void;
  updateDisposalStepStatus: (
    orderId: string,
    stepId: string,
    status: DisposalStatus,
    remark?: string
  ) => void;
  updateDisposalResources: (orderId: string, resources: DisposalOrder['resources']) => void;

  addResourceTemplate: (tpl: Omit<ResourceTemplate, 'id' | 'createdAt'>) => void;
  deleteResourceTemplate: (id: string) => void;
  updateResourceTemplate: (id: string, data: Partial<ResourceTemplate>) => void;

  addOperationLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void;
  getLogsByOrderId: (orderId: string) => OperationLog[];

  getAlarmById: (id: string) => VehicleAlarm | undefined;
  getDisposalById: (id: string) => DisposalOrder | undefined;
  hydrate: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  alarms: mockAlarmList,
  disposalOrders: loadDisposalOrders(),
  currentDispatcher: '调度员小王',
  currentShift: loadShift(),
  resourceTemplates: loadTemplates(),
  operationLogs: loadLogs(),

  setShift: (shift) => {
    saveShift(shift);
    set({ currentShift: shift });
  },

  addDisposalOrder: (order) =>
    set((state) => {
      const newOrders = [order, ...state.disposalOrders];
      saveDisposalOrders(newOrders);

      const log: OperationLog = {
        id: genId('log'),
        orderId: order.id,
        type: 'create_order' as OperationType,
        description: `创建处置单，共 ${order.steps.length} 个处置步骤`,
        operator: state.currentDispatcher,
        shift: state.currentShift,
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
      };
      const newLogs = [log, ...state.operationLogs];
      saveLogs(newLogs);

      console.log('[Store] 新增处置单:', order.id, '当前总数:', newOrders.length);
      return { disposalOrders: newOrders, operationLogs: newLogs };
    }),

  updateDisposalStepStatus: (orderId, stepId, status, remark) =>
    set((state) => {
      const newOrders = state.disposalOrders.map((order) => {
        if (order.id !== orderId) return order;
        const newSteps = order.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                status,
                updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
                remark: remark || step.remark
              }
            : step
        );
        const newOverall = computeOverallStatus(newSteps);
        return {
          ...order,
          steps: newSteps,
          overallStatus: newOverall
        };
      });
      saveDisposalOrders(newOrders);

      const order = newOrders.find((o) => o.id === orderId);
      const step = order?.steps.find((s) => s.id === stepId);
      if (order && step) {
        const log: OperationLog = {
          id: genId('log'),
          orderId,
          type: 'update_step' as OperationType,
          description: `${step.role} ${step.name} 状态更新为「${
            {
              pending: '待通知',
              notified: '已通知',
              departed: '已出发',
              replenished: '已补冷',
              verified: '已复核'
            }[status]
          }」`,
          operator: state.currentDispatcher,
          shift: state.currentShift,
          timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
          detail: remark
        };
        const newLogs = [log, ...state.operationLogs];
        saveLogs(newLogs);
        set({ operationLogs: newLogs });
      }

      console.log(
        '[Store] 更新处置单步骤:',
        orderId,
        stepId,
        '→',
        status,
        '总体状态:',
        order?.overallStatus
      );
      return { disposalOrders: newOrders };
    }),

  updateDisposalResources: (orderId, resources) =>
    set((state) => {
      const newOrders = state.disposalOrders.map((order) =>
        order.id === orderId ? { ...order, resources } : order
      );
      saveDisposalOrders(newOrders);

      const log: OperationLog = {
        id: genId('log'),
        orderId,
        type: 'update_resources' as OperationType,
        description: `更新资源信息：冷藏车${resources.idleRefrigeratedTrucks}辆 / 干冰${resources.dryIceStock}kg / ETA${resources.driverEtaMinutes}分钟`,
        operator: state.currentDispatcher,
        shift: state.currentShift,
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
      };
      const newLogs = [log, ...state.operationLogs];
      saveLogs(newLogs);

      console.log('[Store] 更新处置单资源:', orderId);
      return { disposalOrders: newOrders, operationLogs: newLogs };
    }),

  addResourceTemplate: (tpl) =>
    set((state) => {
      const newTpl: ResourceTemplate = {
        ...tpl,
        id: genId('tpl'),
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      };
      const newList = [newTpl, ...state.resourceTemplates];
      saveTemplates(newList);
      console.log('[Store] 新增资源模板:', newTpl.name);
      return { resourceTemplates: newList };
    }),

  deleteResourceTemplate: (id) =>
    set((state) => {
      const newList = state.resourceTemplates.filter((t) => t.id !== id);
      saveTemplates(newList);
      console.log('[Store] 删除资源模板:', id);
      return { resourceTemplates: newList };
    }),

  updateResourceTemplate: (id, data) =>
    set((state) => {
      const newList = state.resourceTemplates.map((t) =>
        t.id === id ? { ...t, ...data } : t
      );
      saveTemplates(newList);
      return { resourceTemplates: newList };
    }),

  addOperationLog: (log) =>
    set((state) => {
      const newLog: OperationLog = {
        ...log,
        id: genId('log'),
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
      };
      const newLogs = [newLog, ...state.operationLogs];
      saveLogs(newLogs);
      return { operationLogs: newLogs };
    }),

  getLogsByOrderId: (orderId) =>
    get().operationLogs.filter((log) => log.orderId === orderId),

  getAlarmById: (id) => get().alarms.find((a) => a.id === id),

  getDisposalById: (id) => get().disposalOrders.find((d) => d.id === id),

  hydrate: () => {
    const orders = loadDisposalOrders();
    const shift = loadShift();
    const templates = loadTemplates();
    const logs = loadLogs();
    console.log(
      '[Store] hydrate 加载:',
      orders.length,
      '单 /',
      templates.length,
      '模板 /',
      logs.length,
      '条日志 / 班次:',
      shift
    );
    set({
      disposalOrders: orders,
      currentShift: shift,
      resourceTemplates: templates,
      operationLogs: logs
    });
  }
}));
