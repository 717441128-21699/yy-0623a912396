import React, { useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import StatusTag from '@/components/StatusTag';
import { useAppStore } from '@/store/useAppStore';
import { disposalStatusLabels, shiftLabels, operationTypeLabels } from '@/types';
import type { DisposalStatus, DisposalStep, OperationLog, ShiftType } from '@/types';
import styles from './index.module.scss';

const DisposalDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id || '';

  const disposalOrders = useAppStore((state) => state.disposalOrders);
  const operationLogs = useAppStore((state) => state.operationLogs);
  const updateDisposalStepStatus = useAppStore((state) => state.updateDisposalStepStatus);
  const hydrate = useAppStore((state) => state.hydrate);
  const [showLogs, setShowLogs] = useState(true);

  useDidShow(() => {
    hydrate();
    console.log('[DisposalDetail] useDidShow 触发 hydrate, orderId:', orderId);
  });

  const order = useMemo(() => {
    const found = disposalOrders.find((d) => d.id === orderId);
    return found || undefined;
  }, [disposalOrders, orderId]);

  const orderLogs = useMemo(() => {
    return operationLogs.filter((log) => log.orderId === orderId);
  }, [operationLogs, orderId]);

  const getLogIcon = (type: OperationLog['type']): string => {
    const icons = {
      create_order: '📝',
      update_step: '✅',
      update_resources: '🛠️',
      generate_plan: '💡',
      shift_handover: '🔄'
    };
    return icons[type] || '📋';
  };

  const handleStatusChange = (stepId: string, newStatus: DisposalStatus) => {
    updateDisposalStepStatus(orderId, stepId, newStatus);
    Taro.showToast({
      title: '状态已更新',
      icon: 'success',
      duration: 800
    });
  };

  const getNextStatus = (currentStatus: DisposalStatus): DisposalStatus | null => {
    const statusFlow: DisposalStatus[] = [
      'pending',
      'notified',
      'departed',
      'replenished',
      'verified'
    ];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const getNextStatusLabel = (status: DisposalStatus): string => {
    const labels: Record<DisposalStatus, string> = {
      pending: '标记已通知',
      notified: '标记已出发',
      departed: '标记已补冷',
      replenished: '标记已复核',
      verified: '已完成'
    };
    return labels[status];
  };

  const getStepIcon = (type: string): string => {
    const icons: Record<string, string> = {
      driver: '👨‍✈️',
      shipper: '📦',
      coldPoint: '❄️'
    };
    return icons[type] || '📞';
  };

  const isStepDone = (status: DisposalStatus): boolean => {
    return status !== 'pending';
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyText}>处置单不存在</Text>
        </View>
      </View>
    );
  }

  const overallStatusTypeMap: Record<DisposalStatus, string> = {
    pending: 'error',
    notified: 'warning',
    departed: 'warning',
    replenished: 'info',
    verified: 'success'
  };

  const completedSteps = order.steps.filter((s) => s.status !== 'pending').length;

  return (
    <View className={styles.page}>
      <View className={styles.orderHeader}>
        <Text className={styles.orderId}>{order.id}</Text>
        <Text className={styles.orderInfo}>创建时间：{order.createdAt}</Text>
        <View className={styles.orderMeta}>
          <View className={styles.metaTag}>
            <Text>👤 {order.createdBy}</Text>
          </View>
          <View className={styles.metaTag}>
            <Text>{order.shift === 'day' ? '☀️' : '🌙'} {shiftLabels[order.shift as ShiftType]}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>🚛</Text>
          <Text>车辆信息</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>车牌号</Text>
            <Text className={styles.infoValue}>{order.plateNumber}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>线路</Text>
            <Text className={styles.infoValue}>{order.route}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>货主</Text>
            <Text className={styles.infoValue}>{order.shipper}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>创建人</Text>
            <Text className={styles.infoValue}>{order.createdBy}</Text>
          </View>
        </View>

        <View className={styles.statusSection}>
          <View className={styles.statusIcon}>
            <Text>📊</Text>
          </View>
          <View className={styles.statusInfo}>
            <Text className={styles.statusText}>
              总体进度：{completedSteps}/{order.steps.length}
            </Text>
            <Text className={styles.statusDesc}>
              当前状态：
              <StatusTag
                type={overallStatusTypeMap[order.overallStatus] as any}
                text={disposalStatusLabels[order.overallStatus]}
                size="sm"
              />
            </Text>
          </View>
        </View>
      </View>

      <View className={classNames(styles.section, styles.stepsSection)}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>📋</Text>
          <Text>处置步骤</Text>
        </View>

        {order.steps.map((step: DisposalStep, index: number) => {
          const nextStatus = getNextStatus(step.status);
          const isLast = index === order.steps.length - 1;
          const done = isStepDone(step.status);

          return (
            <View key={step.id} className={styles.stepItem}>
              <View className={styles.stepTimeline}>
                <View
                  className={classNames(styles.stepDot, {
                    [styles.done]: done,
                    [styles.current]: !done && index === completedSteps
                  })}
                />
                {!isLast && (
                  <View
                    className={classNames(styles.stepLine, {
                      [styles.done]: done
                    })}
                  />
                )}
              </View>

              <View className={styles.stepContent}>
                <View className={styles.stepHeader}>
                  <View style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}>
                    <Text style={{ fontSize: '32rpx' }}>{getStepIcon(step.type)}</Text>
                    <Text className={styles.stepName}>{step.name}</Text>
                  </View>
                  <Text className={styles.stepRole}>{step.role}</Text>
                </View>

                <Text className={styles.stepPhone}>📞 {step.phone}</Text>

                {step.remark && (
                  <View className={styles.stepRemark}>
                    <Text>💬 {step.remark}</Text>
                  </View>
                )}

                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text className={styles.stepUpdatedAt}>
                    更新于 {step.updatedAt.slice(0, 19).replace('T', ' ')}
                  </Text>
                  <StatusTag
                    type={overallStatusTypeMap[step.status] as any}
                    text={disposalStatusLabels[step.status]}
                    size="sm"
                  />
                </View>

                {nextStatus && (
                  <View className={styles.actionButtons}>
                    <Button
                      className={classNames(styles.actionBtn, styles.primary)}
                      onClick={() => handleStatusChange(step.id, nextStatus)}
                    >
                      {getNextStatusLabel(step.status)}
                    </Button>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View className={classNames(styles.section, styles.suggestionSection)}>
        <View className={styles.suggestionTitle}>
          <Text>💡</Text>
          <Text>处置建议</Text>
        </View>
        <Text className={styles.suggestionContent}>{order.suggestion}</Text>
      </View>

      <View className={classNames(styles.section, styles.resourcesSection)}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>🛠️</Text>
          <Text>可用资源</Text>
        </View>
        <View className={styles.resourcesList}>
          <View className={styles.resourceItem}>
            <Text className={styles.resourceLabel}>空闲冷藏车</Text>
            <Text className={styles.resourceValue}>{order.resources.idleRefrigeratedTrucks} 辆</Text>
          </View>
          <View className={styles.resourceItem}>
            <Text className={styles.resourceLabel}>干冰库存</Text>
            <Text className={styles.resourceValue}>{order.resources.dryIceStock} kg</Text>
          </View>
          <View className={styles.resourceItem}>
            <Text className={styles.resourceLabel}>司机预计到达</Text>
            <Text className={styles.resourceValue}>{order.resources.driverEtaMinutes} 分钟</Text>
          </View>
          <View className={styles.resourceItem}>
            <Text className={styles.resourceLabel}>可用补冷点</Text>
            <Text className={styles.resourceValue}>
              {order.resources.nearbyColdStorage.length > 0
                ? order.resources.nearbyColdStorage.join('、')
                : '无'}
            </Text>
          </View>
        </View>
      </View>

      <View className={classNames(styles.section, styles.logsSection)}>
        <View className={styles.logsHeader} onClick={() => setShowLogs(!showLogs)}>
          <View className={styles.logsTitle}>
            <Text className={styles.sectionTitleIcon}>📜</Text>
            <Text>操作记录</Text>
            <Text className={styles.logsCount}>{orderLogs.length} 条</Text>
          </View>
          <Text className={styles.logsToggle}>{showLogs ? '▲' : '▼'}</Text>
        </View>

        {showLogs && (
          <View className={styles.logsList}>
            {orderLogs.length > 0 ? (
              orderLogs.map((log) => (
                <View key={log.id} className={styles.logItem}>
                  <View className={styles.logTimeline}>
                    <View className={styles.logDot} />
                    <View className={styles.logLine} />
                  </View>
                  <View className={styles.logContent}>
                    <View className={styles.logHeader}>
                      <Text className={styles.logIcon}>{getLogIcon(log.type)}</Text>
                      <Text className={styles.logType}>
                        {operationTypeLabels[log.type]}
                      </Text>
                      <View
                        className={classNames(
                          styles.logShiftTag,
                          log.shift === 'day' ? styles.dayShift : styles.nightShift
                        )}
                      >
                        <Text>
                          {log.shift === 'day' ? '☀️' : '🌙'} {shiftLabels[log.shift]}
                        </Text>
                      </View>
                    </View>
                    <Text className={styles.logDesc}>{log.description}</Text>
                    {log.detail && (
                      <Text className={styles.logDetail}>💬 {log.detail}</Text>
                    )}
                    <View className={styles.logMeta}>
                      <Text className={styles.logOperator}>操作人：{log.operator}</Text>
                      <Text className={styles.logTime}>{log.timestamp}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className={styles.logsEmpty}>
                <Text>暂无操作记录</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <Button
        className={styles.backToListBtn}
        onClick={() => Taro.switchTab({ url: '/pages/disposal-list/index' })}
      >
        返回处置单列表
      </Button>
    </View>
  );
};

export default DisposalDetailPage;
