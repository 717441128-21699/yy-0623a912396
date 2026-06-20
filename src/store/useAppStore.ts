import { create } from 'zustand';
import type { VehicleAlarm, DisposalOrder, AvailableResources, DisposalStatus } from '@/types';
import { alarmList as mockAlarmList } from '@/data/alarmList';
import { disposalList as mockDisposalList } from '@/data/disposalList';

interface AppState {
  alarms: VehicleAlarm[];
  disposalOrders: DisposalOrder[];
  currentDispatcher: string;

  addDisposalOrder: (order: DisposalOrder) => void;
  updateDisposalStepStatus: (orderId: string, stepId: string, status: DisposalStatus, remark?: string) => void;
  updateOverallStatus: (orderId: string, status: DisposalStatus) => void;
  getAlarmById: (id: string) => VehicleAlarm | undefined;
  getDisposalById: (id: string) => DisposalOrder | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  alarms: mockAlarmList,
  disposalOrders: mockDisposalList,
  currentDispatcher: '调度员小王',

  addDisposalOrder: (order) =>
    set((state) => ({
      disposalOrders: [order, ...state.disposalOrders]
    })),

  updateDisposalStepStatus: (orderId, stepId, status, remark) =>
    set((state) => ({
      disposalOrders: state.disposalOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              steps: order.steps.map((step) =>
                step.id === stepId
                  ? { ...step, status, updatedAt: new Date().toISOString(), remark: remark || step.remark }
                  : step
              )
            }
          : order
      )
    })),

  updateOverallStatus: (orderId, status) =>
    set((state) => ({
      disposalOrders: state.disposalOrders.map((order) =>
        order.id === orderId ? { ...order, overallStatus: status } : order
      )
    })),

  getAlarmById: (id) => get().alarms.find((a) => a.id === id),

  getDisposalById: (id) => get().disposalOrders.find((d) => d.id === id)
}));
