import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import classNames from 'classnames';
import AlarmCard from '@/components/AlarmCard';
import { useAppStore } from '@/store/useAppStore';
import { sortAlarmsByRisk } from '@/utils/risk';
import type { RiskLevel } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | RiskLevel;

const AlarmListPage: React.FC = () => {
  const alarms = useAppStore((state) => state.alarms);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredAlarms = useMemo(() => {
    let result = [...alarms];
    if (filter !== 'all') {
      result = result.filter((a) => a.riskLevel === filter);
    }
    return sortAlarmsByRisk(result);
  }, [alarms, filter]);

  const stats = useMemo(() => {
    return {
      total: alarms.length,
      high: alarms.filter((a) => a.riskLevel === 'high').length,
      medium: alarms.filter((a) => a.riskLevel === 'medium').length,
      low: alarms.filter((a) => a.riskLevel === 'low').length
    };
  }, [alarms]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'high', label: '高风险' },
    { key: 'medium', label: '中风险' },
    { key: 'low', label: '低风险' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>冷链补冷调度</Text>
        <Text className={styles.headerSubtitle}>当前告警车辆实时监控</Text>

        <View className={styles.statsRow}>
          <View className={classNames(styles.statCard, styles.high)}>
            <Text className={styles.statCardNumber}>{stats.high}</Text>
            <Text className={styles.statCardLabel}>高风险</Text>
          </View>
          <View className={classNames(styles.statCard, styles.medium)}>
            <Text className={styles.statCardNumber}>{stats.medium}</Text>
            <Text className={styles.statCardLabel}>中风险</Text>
          </View>
          <View className={classNames(styles.statCard, styles.low)}>
            <Text className={styles.statCardNumber}>{stats.low}</Text>
            <Text className={styles.statCardLabel}>低风险</Text>
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
      </View>

      <ScrollView scrollY className={styles.listSection}>
        <View className={styles.listTitle}>
          告警列表（{filteredAlarms.length}）
        </View>

        {filteredAlarms.length > 0 ? (
          filteredAlarms.map((alarm) => (
            <AlarmCard key={alarm.id} alarm={alarm} />
          ))
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
