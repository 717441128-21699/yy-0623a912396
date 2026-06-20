import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import AlarmCard from '@/components/AlarmCard';
import { useAppStore } from '@/store/useAppStore';
import { sortAlarmsByRisk } from '@/utils/risk';
import type { RiskLevel, ShiftType } from '@/types';
import { shiftLabels } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | RiskLevel;

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

  const shiftOrderMap = useMemo(() => {
    const map = new Map<string, typeof disposalOrders[0]>();
    disposalOrders.forEach((order) => {
      map.set(order.vehicleId, order);
    });
    return map;
  }, [disposalOrders]);

  const shiftStats = useMemo(() => {
    const shiftOrders = disposalOrders.filter((o) => o.shift === currentShift);
    const pending = shiftOrders.filter((o) => o.overallStatus === 'pending').length;
    const processing = shiftOrders.filter(
      (o) =>
        o.overallStatus === 'notified' ||
        o.overallStatus === 'departed' ||
        o.overallStatus === 'replenished'
    ).length;
    const completed = shiftOrders.filter((o) => o.overallStatus === 'verified').length;
    return { total: shiftOrders.length, pending, processing, completed };
  }, [disposalOrders, currentShift]);

  const filteredAlarms = useMemo(() => {
    let result = [...alarms];
    if (filter !== 'all') {
      result = result.filter((a) => a.riskLevel === filter);
    }
    return sortAlarmsByRisk(result);
  }, [alarms, filter]);

  const riskStats = useMemo(() => {
    return {
      total: alarms.length,
      high: alarms.filter((a) => a.riskLevel === 'high').length,
      medium: alarms.filter((a) => a.riskLevel === 'medium').length,
      low: alarms.filter((a) => a.riskLevel === 'low').length
    };
  }, [alarms]);

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
  };

  const handleCardClick = (alarmId: string) => {
    Taro.navigateTo({
      url: `/pages/vehicle-detail/index?id=${alarmId}`
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>冷链补冷调度</Text>
        <Text className={styles.headerSubtitle}>当前告警车辆实时监控</Text>

        <View className={styles.shiftTabs}>
          {shiftTabs.map((tab) => (
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
                {currentShift === tab.key ? shiftStats.total + '单' : '切换'}
              </Text>
            </View>
          ))}
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
            共 {riskStats.total} 辆告警 · 高 {riskStats.high} / 中 {riskStats.medium} / 低{' '}
            {riskStats.low}
          </Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.listSection}>
        <View className={styles.listHeader}>
          <Text className={styles.listTitle}>告警列表</Text>
          <Text className={styles.listCount}>{filteredAlarms.length} 辆车</Text>
        </View>

        {filteredAlarms.length > 0 ? (
          filteredAlarms.map((alarm) => {
            const order = shiftOrderMap.get(alarm.id);
            return (
              <View key={alarm.id} onClick={() => handleCardClick(alarm.id)}>
                <AlarmCard alarm={alarm} disposalStatus={order?.overallStatus} />
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>❄️</Text>
            <Text className={styles.emptyText}>暂无告警车辆</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AlarmListPage;
