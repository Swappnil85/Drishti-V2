/**
 * Modal Template Component
 * Reusable modal with different sizes and positions
 */

import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ModalTemplateProps } from '../../types/components';
import { Text, Button, Icon, Flex } from '../ui';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ModalTemplate: React.FC<ModalTemplateProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  size = 'medium',
  position = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = 'slide',
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  // Get modal size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: Math.min(320, screenWidth - 64),
          maxHeight: screenHeight * 0.5,
        };
      case 'medium':
        return {
          width: Math.min(480, screenWidth - 32),
          maxHeight: screenHeight * 0.7,
        };
      case 'large':
        return {
          width: Math.min(640, screenWidth - 16),
          maxHeight: screenHeight * 0.85,
        };
      case 'fullscreen':
        return {
          width: screenWidth,
          height: screenHeight,
        };
      default:
        return {
          width: Math.min(480, screenWidth - 32),
          maxHeight: screenHeight * 0.7,
        };
    }
  };

  // Get position styles
  const getPositionStyles = () => {
    if (size === 'fullscreen') {
      return {
        justifyContent: 'flex-start' as const,
        alignItems: 'stretch' as const,
      };
    }

    switch (position) {
      case 'top':
        return {
          justifyContent: 'flex-start' as const,
          alignItems: 'center' as const,
          paddingTop: 64,
        };
      case 'bottom':
        return {
          justifyContent: 'flex-end' as const,
          alignItems: 'center' as const,
          paddingBottom: 32,
        };
      case 'center':
      default:
        return {
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  // Modal content styles
  const contentStyles = [
    styles.content,
    {
      backgroundColor: theme.colors.background.primary,
      borderRadius: size === 'fullscreen' ? 0 : theme.borderRadius.lg,
      ...theme.shadows.lg,
      ...sizeStyles,
    },
    style,
  ];

  // Render modal header
  const renderHeader = () => {
    if (!title && !showCloseButton) return null;

    return (
      <View style={styles.header}>
        <Flex direction='row' justify='space-between' align='center'>
          <View style={styles.headerContent}>
            {title && (
              <Text
                variant='h5'
                weight='semiBold'
                color='text.primary'
                style={styles.title}
              >
                {title}
              </Text>
            )}

            {subtitle && (
              <Text
                variant='body2'
                color='text.secondary'
                style={styles.subtitle}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {showCloseButton && (
            <Button
              variant='ghost'
              size='sm'
              onPress={onClose}
              leftIcon={<Icon name='close' size='md' color='text.secondary' />}
              accessibilityLabel='Close modal'
              testID={`${testID}-close`}
              style={styles.closeButton}
            >
              Close
            </Button>
          )}
        </Flex>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={[styles.overlay, positionStyles]}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
          testID={`${testID}-backdrop`}
        />

        {/* Modal Content */}
        <View style={contentStyles}>
          {renderHeader()}

          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    margin: 16,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 16,
  },
  body: {
    flex: 1,
    padding: 20,
  },
});

export default ModalTemplate;
