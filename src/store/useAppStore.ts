import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { VehicleAlarm, DisposalOrder, DisposalStatus, DisposalStep } from '@/types';
import { alarmList as mockAlarmList } from '@/data/alarmList';
import { disposalList as mockDisposalList } from '@/data/disposalList';

const STORAGE_KEY_DISPOSAL = 'cold_chain_disposal_orders';

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

interface AppState {
  alarms: VehicleAlarm[];
  disposalOrders: DisposalOrder[];
  currentDispatcher: string;

  addDisposalOrder: (order: DisposalOrder) => void;
  updateDisposalStepStatus: (
    orderId: string,
    stepId: string,
    status: DisposalStatus,
    remark?: string
  ) => void;
  getAlarmById: (id: string) => VehicleAlarm | undefined;
  getDisposalById: (id: string) => DisposalOrder | undefined;
  hydrate: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  alarms: mockAlarmList,
  disposalOrders: loadDisposalOrders(),
  currentDispatcher: '调度员小王',

  addDisposalOrder: (order) =>
    set((state) => {
      const newOrders = [order, ...state.disposalOrders];
      saveDisposalOrders(newOrders);
      console.log('[Store] 新增处置单:', order.id, '当前总数:', newOrders.length);
      return { disposalOrders: newOrders };
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
      console.log(
        '[Store] 更新处置单步骤:',
        orderId,
        stepId,
        '→',
        status,
        '总体状态:',
        computeOverallStatus(
          newOrders.find((o) => o.id === orderId)?.steps || []
        )
      );
      return { disposalOrders: newOrders };
    }),

  getAlarmById: (id) => get().alarms.find((a) => a.id === id),

  getDisposalById: (id) => get().disposalOrders.find((d) => d.id === id),

  hydrate: () => {
    const loaded = loadDisposalOrders();
    console.log('[Store] hydrate 加载处置单:', loaded.length, '条');
    set({ disposalOrders: loaded });
  }
}));
