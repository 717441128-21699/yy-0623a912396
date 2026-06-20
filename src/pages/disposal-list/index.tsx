import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import DisposalCard from '@/components/DisposalCard';
import { useAppStore } from '@/store/useAppStore';
import type { DisposalStatus } from '@/types';
import styles from './index.module.scss';

type FilterType = 'all' | 'pending' | 'inProgress' | 'done';

const DisposalListPage: React.FC = () => {
  const disposalOrders = useAppStore((state) => state.disposalOrders);
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

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return disposalOrders;
    if (filter === 'pending') {
      return disposalOrders.filter((o) => o.overallStatus === 'pending');
    }
    if (filter === 'inProgress') {
      return disposalOrders.filter((o) =>
        ['notified', 'departed', 'replenished'].includes(o.overallStatus)
      );
    }
    if (filter === 'done') {
      return disposalOrders.filter((o) => o.overallStatus === 'verified');
    }
    return disposalOrders;
  }, [disposalOrders, filter]);

  const stats = useMemo(() => {
    return {
      total: disposalOrders.length,
      pending: disposalOrders.filter((o) => o.overallStatus === 'pending').length,
      inProgress: disposalOrders.filter((o) =>
        ['notified', 'departed', 'replenished'].includes(o.overallStatus)
      ).length,
      done: disposalOrders.filter((o) => o.overallStatus === 'verified').length
    };
  }, [disposalOrders]);

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'inProgress', label: '进行中' },
    { key: 'done', label: '已完成' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>处置单</Text>
        <Text className={styles.headerSubtitle}>跟踪每单处置进度，便于交接</Text>
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
        <View className={styles.shiftInfo}>
          <Text className={styles.shiftIcon}>📋</Text>
          <Text className={styles.shiftText}>
            当前班次：<Text className={styles.shiftTextHighlight}>白班</Text> | 共 {stats.total} 单待跟进
          </Text>
        </View>

        <View className={styles.listTitle}>
          处置单列表（{filteredOrders.length}）
        </View>

        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <DisposalCard key={order.id} order={order} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📝</Text>
            <Text className={styles.emptyText}>暂无处置单</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DisposalListPage;
