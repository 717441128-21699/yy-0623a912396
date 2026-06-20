import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import AlarmCard from '@/components/AlarmCard';
import { useAppStore } from '@/store/useAppStore';
import { sortAlarmsByRisk } from '@/utils/risk';
import type { RiskLevel, ShiftType, DisposalOrder, DisposalStatus } from '@/types';
import { shiftLabels, riskLevelLabels } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | RiskLevel;

function getShiftFromTime(alarmTime: string): ShiftType {
  const hour = parseInt(alarmTime.slice(11, 13), 10);
  return hour >= 8 && hour < 20 ? 'day' : 'night';
}

function getVehicleStatus(
  alarm: any,
  orderMap: Map<string, DisposalOrder>
): { status: DisposalStatus | 'pending'; order?: DisposalOrder } {
  const order = orderMap.get(alarm.id);
  if (order) {
    return { status: order.overallStatus, order };
  }
  return { status: 'pending' };
}

const AlarmListPage: React.FC = () => {
  const alarms = useAppStore((state) => state.alarms);
  const disposalOrders = useAppStore((state) => state.disposalOrders);
  const currentShift = useAppStore((state) => state.currentShift);
  const setShift = useAppStore((state) => state.setShift);
  const hydrate = useAppStore((state) => state.hydrate);
  const [filter, setFilter] = useState<FilterType>('all');

  useDidShow(() => {
    hydrate();
  });

  const shiftAlarms = useMemo(() => {
    return alarms.filter((a) => getShiftFromTime(a.alarmTime) === currentShift);
  }, [alarms, currentShift]);

  const shiftOrderMap = useMemo(() => {
    const map = new Map<string, DisposalOrder>();
    const shiftOrderIds = new Set(shiftAlarms.map((a) => a.id));
    disposalOrders.forEach((order) => {
      if (!shiftOrderIds.has(order.vehicleId)) return;
      const existing = map.get(order.vehicleId);
      if (!existing || order.createdAt > existing.createdAt) {
        map.set(order.vehicleId, order);
      }
    });
    return map;
  }, [disposalOrders, shiftAlarms]);

  const shiftStats = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let completed = 0;

    shiftAlarms.forEach((alarm) => {
      const { status } = getVehicleStatus(alarm, shiftOrderMap);
      if (status === 'pending') {
        pending++;
      } else if (status === 'verified') {
        completed++;
      } else {
        processing++;
      }
    });

    return { total: shiftAlarms.length, pending, processing, completed };
  }, [shiftAlarms, shiftOrderMap]);

  const filteredAlarms = useMemo(() => {
    let result = [...shiftAlarms];
    if (filter !== 'all') {
      result = result.filter((a) => a.riskLevel === filter);
    }
    return sortAlarmsByRisk(result);
  }, [shiftAlarms, filter]);

  const filteredStats = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let completed = 0;

    filteredAlarms.forEach((alarm) => {
      const { status } = getVehicleStatus(alarm, shiftOrderMap);
      if (status === 'pending') {
        pending++;
      } else if (status === 'verified') {
        completed++;
      } else {
        processing++;
      }
    });

    return { total: filteredAlarms.length, pending, processing, completed };
  }, [filteredAlarms, shiftOrderMap]);

  const riskStats = useMemo(() => {
    return {
      total: shiftAlarms.length,
      high: shiftAlarms.filter((a) => a.riskLevel === 'high').length,
      medium: shiftAlarms.filter((a) => a.riskLevel === 'medium').length,
      low: shiftAlarms.filter((a) => a.riskLevel === 'low').length
    };
  }, [shiftAlarms]);

  usePullDownRefresh(() => {
    hydrate();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const shiftTabs: { key: ShiftType; label: string; icon: string }[] = [
    { key: 'day', label: '白班', icon: '☀️' },
    { key: 'night', label: '夜班', icon: '🌙' }
  ];

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'high', label: '高风险' },
    { key: 'medium', label: '中风险' },
    { key: 'low', label: '低风险' }
  ];

  const handleShiftChange = (shift: ShiftType) => {
    setShift(shift);
    setFilter('all');
  };

  const handleCardClick = (alarmId: string) => {
    Taro.navigateTo({
      url: `/pages/vehicle-detail/index?id=${alarmId}`
    });
  };

  const getFilterSummaryText = () => {
    const shiftText = `${shiftLabels[currentShift]}${filter === 'all' ? '全部' : riskLevelLabels[filter]}`;
    return `${shiftText}：待处理${filteredStats.pending} / 处理中${filteredStats.processing} / 已完成${filteredStats.completed}`;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>冷链补冷调度</Text>
        <Text className={styles.headerSubtitle}>当前告警车辆实时监控</Text>

        <View className={styles.shiftTabs}>
          {shiftTabs.map((tab) => {
            const tabAlarmCount = alarms.filter(
              (a) => getShiftFromTime(a.alarmTime) === tab.key
            ).length;
            return (
              <View
                key={tab.key}
                className={classNames(
                  styles.shiftTab,
                  currentShift === tab.key && styles.shiftTabActive
                )}
                onClick={() => handleShiftChange(tab.key)}
              >
                <Text className={styles.shiftTabIcon}>{tab.icon}</Text>
                <Text className={styles.shiftTabLabel}>{shiftLabels[tab.key]}</Text>
                <Text className={styles.shiftTabCount}>
                  {tabAlarmCount}辆
                </Text>
              </View>
            );
          })}
        </View>

        <View className={styles.statsRow}>
          <View className={classNames(styles.statCard, styles.pending)}>
            <Text className={styles.statCardNumber}>{shiftStats.pending}</Text>
            <Text className={styles.statCardLabel}>待处理</Text>
          </View>
          <View className={classNames(styles.statCard, styles.processing)}>
            <Text className={styles.statCardNumber}>{shiftStats.processing}</Text>
            <Text className={styles.statCardLabel}>处理中</Text>
          </View>
          <View className={classNames(styles.statCard, styles.completed)}>
            <Text className={styles.statCardNumber}>{shiftStats.completed}</Text>
            <Text className={styles.statCardLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterTabs}>
          {filterTabs.map((tab) => (
            <View
              key={tab.key}
              className={classNames(styles.filterTab, filter === tab.key && styles.active)}
              onClick={() => setFilter(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.riskMiniStats}>
          <Text className={styles.riskMiniText}>
            {shiftLabels[currentShift]}共 {riskStats.total} 辆 · 高 {riskStats.high} / 中{' '}
            {riskStats.medium} / 低 {riskStats.low}
          </Text>
        </View>

        {filter !== 'all' && (
          <View className={styles.filterSummary}>
            <Text className={styles.filterSummaryText}>
              📍 当前筛选：{getFilterSummaryText()}
            </Text>
          </View>
        )}
      </View>

      <ScrollView scrollY className={styles.listSection}>
        <View className={styles.listHeader}>
          <Text className={styles.listTitle}>
            {shiftLabels[currentShift]}处置车辆
          </Text>
          <Text className={styles.listCount}>{filteredAlarms.length} 辆车</Text>
        </View>

        {filteredAlarms.length > 0 ? (
          filteredAlarms.map((alarm) => {
            const { status, order } = getVehicleStatus(alarm, shiftOrderMap);
            const displayStatus = status === 'pending' ? undefined : status;
            return (
              <View key={alarm.id} onClick={() => handleCardClick(alarm.id)}>
                <AlarmCard alarm={alarm} disposalStatus={displayStatus} />
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>❄️</Text>
            <Text className={styles.emptyText}>
              {shiftLabels[currentShift]}
              {filter === 'all' ? '暂无处置车辆' : `暂无${riskLevelLabels[filter]}车辆`}
            </Text>
            <Text className={styles.emptySubtext}>切换班次或下拉刷新查看</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AlarmListPage;
