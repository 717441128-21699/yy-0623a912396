import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import DisposalCard from '@/components/DisposalCard';
import { useAppStore } from '@/store/useAppStore';
import type { DisposalStatus, ShiftType } from '@/types';
import { shiftLabels } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | 'pending' | 'inProgress' | 'done';

const DisposalListPage: React.FC = () => {
  const disposalOrders = useAppStore((state) => state.disposalOrders);
  const currentShift = useAppStore((state) => state.currentShift);
  const setShift = useAppStore((state) => state.setShift);
  const hydrate = useAppStore((state) => state.hydrate);
  const [filter, setFilter] = useState<FilterType>('all');

  useDidShow(() => {
    hydrate();
    console.log('[DisposalList] useDidShow 触发 hydrate, 总数:', disposalOrders.length);
  });

  usePullDownRefresh(() => {
    hydrate();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 600);
  });

  const shiftOrders = useMemo(
    () => disposalOrders.filter((o) => o.shift === currentShift),
    [disposalOrders, currentShift]
  );

  const filteredOrders = useMemo(() => {
    let list = shiftOrders;
    if (filter === 'pending') {
      list = list.filter((o) => o.overallStatus === 'pending');
    } else if (filter === 'inProgress') {
      list = list.filter((o) =>
        ['notified', 'departed', 'replenished'].includes(o.overallStatus)
      );
    } else if (filter === 'done') {
      list = list.filter((o) => o.overallStatus === 'verified');
    }
    return list;
  }, [shiftOrders, filter]);

  const stats = useMemo(() => {
    return {
      total: shiftOrders.length,
      pending: shiftOrders.filter((o) => o.overallStatus === 'pending').length,
      inProgress: shiftOrders.filter((o) =>
        ['notified', 'departed', 'replenished'].includes(o.overallStatus)
      ).length,
      done: shiftOrders.filter((o) => o.overallStatus === 'verified').length
    };
  }, [shiftOrders]);

  const allStats = useMemo(() => {
    return {
      total: disposalOrders.length,
      day: disposalOrders.filter((o) => o.shift === 'day').length,
      night: disposalOrders.filter((o) => o.shift === 'night').length
    };
  }, [disposalOrders]);

  const shiftTabs: { key: ShiftType; label: string; icon: string }[] = [
    { key: 'day', label: '白班', icon: '☀️' },
    { key: 'night', label: '夜班', icon: '🌙' }
  ];

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'inProgress', label: '进行中' },
    { key: 'done', label: '已完成' }
  ];

  const handleCardClick = (orderId: string) => {
    Taro.navigateTo({
      url: `/pages/disposal-detail/index?id=${orderId}`
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>处置单</Text>
        <Text className={styles.headerSubtitle}>跟踪每单处置进度，便于交接</Text>

        <View className={styles.shiftTabs}>
          {shiftTabs.map((tab) => (
            <View
              key={tab.key}
              className={classNames(
                styles.shiftTab,
                currentShift === tab.key && styles.shiftTabActive
              )}
              onClick={() => setShift(tab.key)}
            >
              <Text className={styles.shiftTabIcon}>{tab.icon}</Text>
              <Text className={styles.shiftTabLabel}>{shiftLabels[tab.key]}</Text>
              <Text className={styles.shiftTabCount}>
                {tab.key === 'day' ? allStats.day : allStats.night}单
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.summarySection}>
        <View className={styles.summaryCard}>
          <View className={styles.summaryRow}>
            <View className={classNames(styles.summaryItem, styles.pending)}>
              <Text className={styles.summaryItemNumber}>{stats.pending}</Text>
              <Text className={styles.summaryItemLabel}>待处理</Text>
            </View>
            <View className={classNames(styles.summaryItem, styles.inProgress)}>
              <Text className={styles.summaryItemNumber}>{stats.inProgress}</Text>
              <Text className={styles.summaryItemLabel}>进行中</Text>
            </View>
            <View className={classNames(styles.summaryItem, styles.done)}>
              <Text className={styles.summaryItemNumber}>{stats.done}</Text>
              <Text className={styles.summaryItemLabel}>已完成</Text>
            </View>
          </View>
          <View className={styles.summaryFooter}>
            <Text className={styles.summaryFooterText}>
              {shiftLabels[currentShift]}共 {stats.total} 单 · 全部 {allStats.total} 单
            </Text>
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
        <View className={styles.listHeader}>
          <Text className={styles.listTitle}>处置单列表</Text>
          <Text className={styles.listCount}>{filteredOrders.length} 单</Text>
        </View>

        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <View key={order.id} onClick={() => handleCardClick(order.id)}>
              <DisposalCard order={order} />
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📝</Text>
            <Text className={styles.emptyText}>
              {shiftLabels[currentShift]}暂无处置单
            </Text>
            <Text className={styles.emptySubtext}>切换班次或下拉刷新查看</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DisposalListPage;
