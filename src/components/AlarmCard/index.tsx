import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import StatusTag from '@/components/StatusTag';
import { formatDuration } from '@/utils/risk';
import { tempZoneLabels, driverStatusLabels, disposalStatusLabels } from '@/types';
import type { VehicleAlarm, DisposalStatus } from '@/types';
import styles from './index.module.scss';

interface AlarmCardProps {
  alarm: VehicleAlarm;
  disposalStatus?: DisposalStatus;
  onClick?: () => void;
}

const AlarmCard: React.FC<AlarmCardProps> = ({ alarm, disposalStatus, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/vehicle-detail/index?id=${alarm.id}`
      });
    }
  };

  const riskLevelMap = {
    high: { type: 'high' as const, label: '高风险' },
    medium: { type: 'medium' as const, label: '中风险' },
    low: { type: 'low' as const, label: '低风险' }
  };

  const riskInfo = riskLevelMap[alarm.riskLevel];

  const disposalTagType = (status?: DisposalStatus): 'success' | 'warning' | 'error' | 'online' => {
    if (!status) return 'online';
    switch (status) {
      case 'verified': return 'success';
      case 'replenished': return 'success';
      case 'departed': return 'warning';
      case 'notified': return 'warning';
      default: return 'error';
    }
  };

  const disposalTagText = (status?: DisposalStatus): string => {
    if (!status) return '待处置';
    return disposalStatusLabels[status];
  };

  return (
    <View
      className={classNames(styles.card, styles[`risk-${alarm.riskLevel}`])}
      onClick={handleClick}
    >
      <View className={styles.cardHeader}>
        <View className={styles.leftSection}>
          <Text className={styles.plateNumber}>{alarm.plateNumber}</Text>
          <StatusTag type={riskInfo.type} text={riskInfo.label} size="sm" />
        </View>
        <View className={styles.rightSection}>
          <StatusTag
            type={disposalTagType(disposalStatus)}
            text={disposalTagText(disposalStatus)}
            size="sm"
          />
        </View>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>货主</Text>
            <Text className={styles.infoValue}>{alarm.shipper}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>温区</Text>
            <Text className={styles.infoValue}>{tempZoneLabels[alarm.tempZone]}</Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>当前温度</Text>
            <Text className={classNames(styles.tempValue, styles.highlight)}>
              {alarm.currentTemp}℃
              <Text className={styles.targetTemp}> / {alarm.targetTemp}℃</Text>
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>超温时长</Text>
            <Text className={classNames(styles.infoValue, styles.warning)}>
              {formatDuration(alarm.overTempDuration)}
            </Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>最近补冷点</Text>
            <Text className={styles.infoValue}>{alarm.nearestColdPoint}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>距离</Text>
            <Text className={styles.infoValue}>{alarm.distanceToColdPoint}km</Text>
          </View>
        </View>
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.driverInfo}>
          <View
            className={classNames(styles.driverDot, styles[`status-${alarm.driverStatus}`])}
          />
          <Text className={styles.driverName}>{alarm.driverName}</Text>
          <StatusTag type={alarm.driverStatus} text={driverStatusLabels[alarm.driverStatus]} size="sm" />
        </View>
        <Text className={styles.riskScore}>风险分 {alarm.riskScore}</Text>
      </View>
    </View>
  );
};

export default AlarmCard;
