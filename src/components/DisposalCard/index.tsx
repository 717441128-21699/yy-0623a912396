import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import StatusTag from '@/components/StatusTag';
import { disposalStatusLabels } from '@/types';
import type { DisposalOrder } from '@/types';
import styles from './index.module.scss';

interface DisposalCardProps {
  order: DisposalOrder;
  onClick?: () => void;
}

const DisposalCard: React.FC<DisposalCardProps> = ({ order, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/disposal-detail/index?id=${order.id}`
      });
    }
  };

  const completedSteps = order.steps.filter(
    (s) => s.status !== 'pending'
  ).length;

  const statusTypeMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'error',
    notified: 'warning',
    departed: 'warning',
    replenished: 'info',
    verified: 'success'
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <View className={styles.leftSection}>
          <Text className={styles.orderId}>{order.id}</Text>
          <StatusTag
            type={statusTypeMap[order.overallStatus]}
            text={disposalStatusLabels[order.overallStatus]}
            size="sm"
          />
        </View>
        <Text className={styles.plateNumber}>{order.plateNumber}</Text>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>线路</Text>
            <Text className={styles.infoValue}>{order.route}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>货主</Text>
            <Text className={styles.infoValue}>{order.shipper}</Text>
          </View>
        </View>

        <View className={styles.progressSection}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressLabel}>处置进度</Text>
            <Text className={styles.progressText}>
              {completedSteps}/{order.steps.length}
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={classNames(styles.progressFill, styles[order.overallStatus])}
              style={{ width: `${(completedSteps / order.steps.length) * 100}%` }}
            />
          </View>
          <View className={styles.stepDots}>
            {order.steps.map((step) => (
              <View
                key={step.id}
                className={classNames(styles.stepDot, {
                  [styles.stepDone]: step.status !== 'pending'
                })}
              />
            ))}
          </View>
        </View>
      </View>

      <View className={styles.cardFooter}>
        <Text className={styles.createTime}>{order.createdAt}</Text>
        <Text className={styles.createdBy}>{order.createdBy}</Text>
      </View>
    </View>
  );
};

export default DisposalCard;
