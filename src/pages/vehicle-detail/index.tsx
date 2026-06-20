import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import StatusTag from '@/components/StatusTag';
import { useAppStore } from '@/store/useAppStore';
import { generateDisposalPlan, generateSuggestedScript, formatDuration } from '@/utils/risk';
import { tempZoneLabels, driverStatusLabels, riskLevelLabels } from '@/types';
import type { AvailableResources, DisposalStep, DisposalOrder } from '@/types';
import styles from './index.module.scss';

const VehicleDetailPage: React.FC = () => {
  const router = useRouter();
  const vehicleId = router.params.id || '';

  const getAlarmById = useAppStore((state) => state.getAlarmById);
  const addDisposalOrder = useAppStore((state) => state.addDisposalOrder);
  const currentDispatcher = useAppStore((state) => state.currentDispatcher);

  const alarm = useMemo(() => getAlarmById(vehicleId), [vehicleId, getAlarmById]);

  const [resources, setResources] = useState<AvailableResources>({
    idleRefrigeratedTrucks: 1,
    nearbyColdStorage: [],
    dryIceStock: 30,
    driverEtaMinutes: 30
  });

  const [selectedColdStorage, setSelectedColdStorage] = useState<string[]>([]);

  const coldStorageOptions = useMemo(() => {
    if (!alarm) return [];
    return [alarm.nearestColdPoint, '备用冷库A', '备用冷库B'];
  }, [alarm]);

  const plan = useMemo(() => {
    if (!alarm) return null;
    return generateDisposalPlan(alarm, {
      ...resources,
      nearbyColdStorage: selectedColdStorage
    });
  }, [alarm, resources, selectedColdStorage]);

  const driverScript = useMemo(() => {
    if (!alarm) return '';
    return generateSuggestedScript('driver', {
      plateNumber: alarm.plateNumber,
      route: alarm.route,
      tempZone: tempZoneLabels[alarm.tempZone],
      duration: formatDuration(alarm.overTempDuration)
    });
  }, [alarm]);

  const handleColdStorageToggle = (name: string) => {
    setSelectedColdStorage((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleInputChange = (field: keyof AvailableResources, value: string) => {
    const numValue = parseInt(value) || 0;
    setResources((prev) => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleCreateDisposal = () => {
    if (!alarm || !plan) return;

    const steps: DisposalStep[] = [];
    let stepIndex = 1;

    if (plan.priority.includes('driver')) {
      steps.push({
        id: `step-${stepIndex++}`,
        type: 'driver',
        name: alarm.driverName,
        phone: alarm.driverPhone,
        role: '驾驶员',
        status: 'pending',
        updatedAt: new Date().toISOString()
      });
    }

    if (plan.priority.includes('coldPoint') && selectedColdStorage.length > 0) {
      selectedColdStorage.forEach((coldPoint) => {
        steps.push({
          id: `step-${stepIndex++}`,
          type: 'coldPoint',
          name: coldPoint,
          phone: '000-00000000',
          role: '补冷点',
          status: 'pending',
          updatedAt: new Date().toISOString()
        });
      });
    }

    if (plan.priority.includes('shipper')) {
      steps.push({
        id: `step-${stepIndex++}`,
        type: 'shipper',
        name: `${alarm.shipper}-负责人`,
        phone: '000-00000000',
        role: '货主',
        status: 'pending',
        updatedAt: new Date().toISOString()
      });
    }

    const orderId = `D${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(
      Math.floor(Math.random() * 1000)
    ).padStart(3, '0')}`;

    const newOrder: DisposalOrder = {
      id: orderId,
      vehicleId: alarm.id,
      plateNumber: alarm.plateNumber,
      route: alarm.route,
      shipper: alarm.shipper,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      createdBy: currentDispatcher,
      overallStatus: 'pending',
      steps,
      suggestion: plan.suggestion,
      resources: {
        ...resources,
        nearbyColdStorage: selectedColdStorage
      }
    };

    addDisposalOrder(newOrder);

    Taro.showToast({
      title: '处置单已生成',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      Taro.redirectTo({
        url: `/pages/disposal-detail/index?id=${orderId}`
      });
    }, 1500);
  };

  if (!alarm) {
    return (
      <View className={styles.page}>
        <Text>车辆不存在</Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={classNames(styles.vehicleHeader, styles[alarm.riskLevel])}>
        <Text className={styles.plateNumber}>{alarm.plateNumber}</Text>
        <Text className={styles.routeInfo}>{alarm.route}</Text>
        <View className={classNames(styles.riskBadge, styles[alarm.riskLevel])}>
          <Text>⚠️ {riskLevelLabels[alarm.riskLevel]} · 风险分 {alarm.riskScore}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>📦</Text>
          <Text>货物信息</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>货主</Text>
            <Text className={styles.infoValue}>{alarm.shipper}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>温区</Text>
            <Text className={styles.infoValue}>{tempZoneLabels[alarm.tempZone]}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>货物描述</Text>
            <Text className={styles.infoValue}>{alarm.cargoDescription}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>告警时间</Text>
            <Text className={styles.infoValue}>{alarm.alarmTime.slice(11, 16)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>🌡️</Text>
          <Text>温度状态</Text>
        </View>
        <View className={styles.tempDisplay}>
          <Text className={styles.currentTemp}>{alarm.currentTemp}℃</Text>
          <Text className={styles.targetTemp}>目标 {alarm.targetTemp}℃</Text>
        </View>
        <View className={styles.infoGrid} style={{ marginTop: '24rpx' }}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>超温时长</Text>
            <Text className={classNames(styles.infoValue, styles.warning)}>
              {formatDuration(alarm.overTempDuration)}
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>温差</Text>
            <Text className={classNames(styles.infoValue, styles.error)}>
              +{alarm.currentTemp - alarm.targetTemp}℃
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>📍</Text>
          <Text>位置信息</Text>
        </View>
        <View className={styles.infoGrid}>
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

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>👨‍✈️</Text>
          <Text>司机信息</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>司机姓名</Text>
            <Text className={styles.infoValue}>{alarm.driverName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>状态</Text>
            <View>
              <StatusTag
                type={alarm.driverStatus}
                text={driverStatusLabels[alarm.driverStatus]}
                size="sm"
              />
            </View>
          </View>
        </View>
      </View>

      <View className={classNames(styles.section, styles.formSection)}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>🛠️</Text>
          <Text>可用资源</Text>
        </View>

        <View className={styles.formRow}>
          <View className={classNames(styles.formItem, styles.formRowItem)}>
            <Text className={styles.formLabel}>空闲冷藏车(辆)</Text>
            <Input
              className={styles.formInput}
              type="number"
              value={String(resources.idleRefrigeratedTrucks)}
              onInput={(e) => handleInputChange('idleRefrigeratedTrucks', e.detail.value)}
              placeholder="0"
            />
          </View>
          <View className={classNames(styles.formItem, styles.formRowItem)}>
            <Text className={styles.formLabel}>干冰库存(kg)</Text>
            <Input
              className={styles.formInput}
              type="number"
              value={String(resources.dryIceStock)}
              onInput={(e) => handleInputChange('dryIceStock', e.detail.value)}
              placeholder="0"
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>司机预计到达(分钟)</Text>
          <Input
            className={styles.formInput}
            type="number"
            value={String(resources.driverEtaMinutes)}
            onInput={(e) => handleInputChange('driverEtaMinutes', e.detail.value)}
            placeholder="30"
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>可用补冷点</Text>
          <View className={styles.coldStorageList}>
            {coldStorageOptions.map((option) => (
              <View
                key={option}
                className={classNames(
                  styles.coldStorageTag,
                  selectedColdStorage.includes(option) && styles.active
                )}
                onClick={() => handleColdStorageToggle(option)}
              >
                <Text>{selectedColdStorage.includes(option) ? '✓' : '+'}</Text>
                <Text>{option}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {plan && (
        <View className={classNames(styles.section, styles.suggestionSection)}>
          <View className={styles.suggestionTitle}>
            <Text>💡</Text>
            <Text>推荐处置方案</Text>
          </View>
          <Text className={styles.suggestionContent}>{plan.suggestion}</Text>

          <View className={styles.priorityList}>
            <Text style={{ fontSize: '28rpx', fontWeight: 500, color: '#475569', marginBottom: '16rpx' }}>
              推荐联系顺序
            </Text>
            {plan.priority.map((type, index) => (
              <View key={type} className={styles.priorityItem}>
                <View className={styles.priorityNumber}>
                  <Text>{index + 1}</Text>
                </View>
                <View className={styles.priorityInfo}>
                  <Text className={styles.priorityName}>
                    {type === 'driver' && `${alarm.driverName}（司机）`}
                    {type === 'coldPoint' && selectedColdStorage.join('、')}
                    {type === 'shipper' && `${alarm.shipper}（货主）`}
                  </Text>
                  <Text className={styles.priorityRole}>
                    {type === 'driver' && '第一时间确认现场情况'}
                    {type === 'coldPoint' && '协调补冷资源'}
                    {type === 'shipper' && '同步情况避免投诉'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className={styles.scriptSection}>
            <Text className={styles.scriptTitle}>📞 建议话术（司机）</Text>
            <Text className={styles.scriptContent}>{driverScript}</Text>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={() => Taro.navigateBack()}>
          返回
        </Button>
        <Button className={styles.primaryBtn} onClick={handleCreateDisposal}>
          生成处置单
        </Button>
      </View>
    </View>
  );
};

export default VehicleDetailPage;
