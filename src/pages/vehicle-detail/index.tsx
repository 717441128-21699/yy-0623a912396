import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classNames from 'classnames';
import StatusTag from '@/components/StatusTag';
import { useAppStore } from '@/store/useAppStore';
import { generateDisposalPlan, generateSuggestedScript, formatDuration } from '@/utils/risk';
import { tempZoneLabels, driverStatusLabels, riskLevelLabels, shiftLabels } from '@/types';
import type {
  AvailableResources,
  DisposalStep,
  DisposalOrder,
  ResourceTemplate,
  ShiftType
} from '@/types';
import styles from './index.module.scss';

const RESOURCE_LIMITS = {
  idleRefrigeratedTrucks: { min: 0, max: 50, default: 0 },
  dryIceStock: { min: 0, max: 500, default: 0 },
  driverEtaMinutes: { min: 1, max: 600, default: 30 }
};

function sanitizeResourceValue(
  field: keyof typeof RESOURCE_LIMITS,
  rawValue: string
): number {
  const trimmed = (rawValue || '').trim();
  if (trimmed === '' || trimmed === '-') {
    return RESOURCE_LIMITS[field].default;
  }
  let num = parseInt(trimmed, 10);
  if (isNaN(num)) {
    return RESOURCE_LIMITS[field].default;
  }
  if (num < RESOURCE_LIMITS[field].min) {
    num = RESOURCE_LIMITS[field].min;
  }
  if (num > RESOURCE_LIMITS[field].max) {
    num = RESOURCE_LIMITS[field].max;
  }
  return num;
}

const VehicleDetailPage: React.FC = () => {
  const router = useRouter();
  const vehicleId = router.params.id || '';

  const getAlarmById = useAppStore((state) => state.getAlarmById);
  const addDisposalOrder = useAppStore((state) => state.addDisposalOrder);
  const currentDispatcher = useAppStore((state) => state.currentDispatcher);
  const currentShift = useAppStore((state) => state.currentShift);
  const resourceTemplates = useAppStore((state) => state.resourceTemplates);
  const addResourceTemplate = useAppStore((state) => state.addResourceTemplate);
  const deleteResourceTemplate = useAppStore((state) => state.deleteResourceTemplate);
  const hydrate = useAppStore((state) => state.hydrate);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useDidShow(() => {
    hydrate();
  });

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
      idleRefrigeratedTrucks: sanitizeResourceValue(
        'idleRefrigeratedTrucks',
        String(resources.idleRefrigeratedTrucks)
      ),
      nearbyColdStorage: selectedColdStorage,
      dryIceStock: sanitizeResourceValue('dryIceStock', String(resources.dryIceStock)),
      driverEtaMinutes: sanitizeResourceValue(
        'driverEtaMinutes',
        String(resources.driverEtaMinutes)
      )
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
    if (field === 'nearbyColdStorage') return;
    const safeValue = sanitizeResourceValue(field as any, value);
    setResources((prev) => ({
      ...prev,
      [field]: safeValue
    }));
  };

  const handleApplyTemplate = (tpl: ResourceTemplate) => {
    setResources({
      idleRefrigeratedTrucks: tpl.idleRefrigeratedTrucks,
      dryIceStock: tpl.dryIceStock,
      driverEtaMinutes: tpl.driverEtaMinutes,
      nearbyColdStorage: tpl.nearbyColdStorage
    });
    setSelectedColdStorage(tpl.nearbyColdStorage);
    setShowTemplates(false);
    Taro.showToast({
      title: `已套用「${tpl.name}」`,
      icon: 'success',
      duration: 1200
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      Taro.showToast({
        title: '请输入模板名称',
        icon: 'none'
      });
      return;
    }
    addResourceTemplate({
      name: templateName.trim(),
      routePattern: alarm?.route || '',
      idleRefrigeratedTrucks: sanitizeResourceValue(
        'idleRefrigeratedTrucks',
        String(resources.idleRefrigeratedTrucks)
      ),
      nearbyColdStorage: selectedColdStorage,
      dryIceStock: sanitizeResourceValue('dryIceStock', String(resources.dryIceStock)),
      driverEtaMinutes: sanitizeResourceValue(
        'driverEtaMinutes',
        String(resources.driverEtaMinutes)
      )
    });
    setTemplateName('');
    setShowSaveDialog(false);
    Taro.showToast({
      title: '模板已保存',
      icon: 'success'
    });
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    Taro.showModal({
      title: '删除模板',
      content: `确定删除「${name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          deleteResourceTemplate(id);
          Taro.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleCreateDisposal = () => {
    if (!alarm || !plan) return;

    const safeResources: AvailableResources = {
      idleRefrigeratedTrucks: sanitizeResourceValue(
        'idleRefrigeratedTrucks',
        String(resources.idleRefrigeratedTrucks)
      ),
      dryIceStock: sanitizeResourceValue('dryIceStock', String(resources.dryIceStock)),
      driverEtaMinutes: sanitizeResourceValue(
        'driverEtaMinutes',
        String(resources.driverEtaMinutes)
      ),
      nearbyColdStorage: selectedColdStorage
    };

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
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
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
          updatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
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
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
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
      shift: currentShift as ShiftType,
      overallStatus: 'pending',
      steps,
      suggestion: plan.suggestion,
      resources: safeResources
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

  const displayTrucks = sanitizeResourceValue(
    'idleRefrigeratedTrucks',
    String(resources.idleRefrigeratedTrucks)
  );
  const displayDryIce = sanitizeResourceValue('dryIceStock', String(resources.dryIceStock));
  const displayEta = sanitizeResourceValue(
    'driverEtaMinutes',
    String(resources.driverEtaMinutes)
  );

  return (
    <View className={styles.page}>
      <View className={classNames(styles.vehicleHeader, styles[alarm.riskLevel])}>
        <Text className={styles.plateNumber}>{alarm.plateNumber}</Text>
        <Text className={styles.routeInfo}>{alarm.route}</Text>
        <View className={styles.headerMeta}>
          <View className={classNames(styles.riskBadge, styles[alarm.riskLevel])}>
            <Text>⚠️ {riskLevelLabels[alarm.riskLevel]} · 风险分 {alarm.riskScore}</Text>
          </View>
          <View className={styles.shiftBadge}>
            <Text>
              {currentShift === 'day' ? '☀️' : '🌙'} {shiftLabels[currentShift]}
            </Text>
          </View>
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

        <View className={styles.templateBar}>
          <View
            className={styles.templateToggle}
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <Text className={styles.templateToggleIcon}>📋</Text>
            <Text className={styles.templateToggleText}>
              常用方案模板（{resourceTemplates.length}）
            </Text>
            <Text className={styles.templateToggleArrow}>
              {showTemplates ? '▲' : '▼'}
            </Text>
          </View>
          <View
            className={styles.templateSaveBtn}
            onClick={() => setShowSaveDialog(true)}
          >
            <Text>💾 保存当前</Text>
          </View>
        </View>

        {showTemplates && (
          <View className={styles.templateList}>
            {resourceTemplates.length > 0 ? (
              resourceTemplates.map((tpl) => (
                <View key={tpl.id} className={styles.templateItem}>
                  <View
                    className={styles.templateItemMain}
                    onClick={() => handleApplyTemplate(tpl)}
                  >
                    <Text className={styles.templateItemName}>{tpl.name}</Text>
                    <Text className={styles.templateItemDesc}>
                      冷藏车{tpl.idleRefrigeratedTrucks}辆 · 干冰{tpl.dryIceStock}kg · ETA
                      {tpl.driverEtaMinutes}分钟
                    </Text>
                    {tpl.routePattern && (
                      <Text className={styles.templateItemRoute}>线路：{tpl.routePattern}</Text>
                    )}
                  </View>
                  <View
                    className={styles.templateItemDelete}
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                  >
                    <Text>删除</Text>
                  </View>
                </View>
              ))
            ) : (
              <View className={styles.templateEmpty}>
                <Text>暂无保存的模板，点击「保存当前」添加</Text>
              </View>
            )}
          </View>
        )}

        <View className={styles.formRow}>
          <View className={classNames(styles.formItem, styles.formRowItem)}>
            <Text className={styles.formLabel}>空闲冷藏车(0-50辆)</Text>
            <Input
              className={styles.formInput}
              type="number"
              value={String(displayTrucks)}
              onInput={(e) => handleInputChange('idleRefrigeratedTrucks', e.detail.value)}
              placeholder="0"
            />
          </View>
          <View className={classNames(styles.formItem, styles.formRowItem)}>
            <Text className={styles.formLabel}>干冰库存(0-500kg)</Text>
            <Input
              className={styles.formInput}
              type="number"
              value={String(displayDryIce)}
              onInput={(e) => handleInputChange('dryIceStock', e.detail.value)}
              placeholder="0"
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>司机预计到达(1-600分钟)</Text>
          <Input
            className={styles.formInput}
            type="number"
            value={String(displayEta)}
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
            <Text
              style={{
                fontSize: '28rpx',
                fontWeight: 500,
                color: '#475569',
                marginBottom: '16rpx'
              }}
            >
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

      {showSaveDialog && (
        <View className={styles.dialogMask} onClick={() => setShowSaveDialog(false)}>
          <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.dialogTitle}>保存资源模板</Text>
            <Input
              className={styles.dialogInput}
              value={templateName}
              onInput={(e) => setTemplateName(e.detail.value)}
              placeholder="输入模板名称，如：白班常用方案"
              maxlength={20}
            />
            <View className={styles.dialogActions}>
              <View
                className={classNames(styles.dialogBtn, styles.dialogBtnCancel)}
                onClick={() => setShowSaveDialog(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                className={classNames(styles.dialogBtn, styles.dialogBtnConfirm)}
                onClick={handleSaveTemplate}
              >
                <Text>保存</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default VehicleDetailPage;
