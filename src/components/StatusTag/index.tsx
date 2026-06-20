import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface StatusTagProps {
  type?: 'high' | 'medium' | 'low' | 'success' | 'warning' | 'error' | 'info' | 'online' | 'offline' | 'busy';
  text: string;
  size?: 'sm' | 'md';
}

const StatusTag: React.FC<StatusTagProps> = ({ type = 'info', text, size = 'md' }) => {
  return (
    <View className={classNames(styles.tag, styles[`tag-${type}`], styles[`size-${size}`])}>
      <Text className={styles.tagText}>{text}</Text>
    </View>
  );
};

export default StatusTag;
