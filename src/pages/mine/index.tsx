import React from 'react';
import { View, Text } from '@tarojs/components';
import { useAppStore } from '@/store/useAppStore';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const currentDispatcher = useAppStore((state) => state.currentDispatcher);
  const disposalOrders = useAppStore((state) => state.disposalOrders);

  const myStats = {
    todayOrders: disposalOrders.filter((o) => o.createdBy === currentDispatcher).length,
    completed: disposalOrders.filter(
      (o) => o.createdBy === currentDispatcher && o.overallStatus === 'verified'
    ).length,
    inProgress: disposalOrders.filter(
      (o) =>
        o.createdBy === currentDispatcher &&
        ['notified', 'departed', 'replenished'].includes(o.overallStatus)
    ).length
  };

  const menuItems = [
    {
      group: '工作管理',
      items: [
        { icon: '📋', title: '交接班记录', desc: '查看历史交接班信息' },
        { icon: '📊', title: '我的工单', desc: '查看我创建的处置单' },
        { icon: '❄️', title: '补冷点管理', desc: '维护补冷点信息' }
      ]
    },
    {
      group: '设置',
      items: [
        { icon: '🔔', title: '告警提醒设置', desc: '自定义告警通知方式' },
        { icon: '📱', title: '联系客服', desc: '技术支持与帮助' },
        { icon: 'ℹ️', title: '关于我们', desc: '版本信息' }
      ]
    }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>👤</Text>
          </View>
          <View className={styles.userDetails}>
            <Text className={styles.userName}>{currentDispatcher}</Text>
            <Text className={styles.userRole}>冷链调度员</Text>
            <View className={styles.shiftTag}>
              <Text>🟢 值班中</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.statsSection}>
        <View className={styles.statsCard}>
          <View className={styles.statsRow}>
            <View className={styles.statsItem}>
              <Text className={styles.statsItemNumber}>{myStats.todayOrders}</Text>
              <Text className={styles.statsItemLabel}>今日工单</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsItemNumber}>{myStats.inProgress}</Text>
              <Text className={styles.statsItemLabel}>处理中</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsItemNumber}>{myStats.completed}</Text>
              <Text className={styles.statsItemLabel}>已完成</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.menuSection}>
        {menuItems.map((group, groupIndex) => (
          <View key={groupIndex}>
            <Text className={styles.menuGroupTitle}>{group.group}</Text>
            <View className={styles.menuGroup}>
              {group.items.map((item, itemIndex) => (
                <View key={itemIndex} className={styles.menuItem}>
                  <View className={styles.menuIcon}>
                    <Text>{item.icon}</Text>
                  </View>
                  <View className={styles.menuContent}>
                    <Text className={styles.menuTitle}>{item.title}</Text>
                    <Text className={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <Text className={styles.menuArrow}>›</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.versionSection}>
        <Text className={styles.versionText}>冷链补冷调度 v1.0.0</Text>
      </View>
    </View>
  );
};

export default MinePage;
