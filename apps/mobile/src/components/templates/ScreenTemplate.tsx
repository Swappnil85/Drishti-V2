/**
 * Screen Template Component
 * Base template for all screens with consistent layout and features
 */

import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ScreenTemplateProps } from '../../types/components';
import { Container } from '../ui';
import Header from './Header';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

const ScreenTemplate: React.FC<ScreenTemplateProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  showBackButton = false,
  onBackPress,
  scrollable = true,
  refreshing = false,
  onRefresh,
  loading = false,
  error,
  onRetry,
  safeArea = true,
  padding = 'base',
  backgroundColor,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  // Get background color
  const bgColor = backgroundColor || theme.colors.background.primary;

  // Create container styles
  const containerStyles = [
    styles.container,
    {
      backgroundColor: bgColor,
    },
    style,
  ];

  // Render content based on state
  const renderContent = () => {
    // Show loading state
    if (loading) {
      return (
        <LoadingState
          message="Loading..."
          size="lg"
          overlay={false}
        />
      );
    }

    // Show error state
    if (error) {
      return (
        <ErrorState
          error={error}
          onRetry={onRetry}
          showIcon={true}
        />
      );
    }

    // Show main content
    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary[500]}
                colors={[theme.colors.primary[500]]}
              />
            ) : undefined
          }
        >
          <Container padding={padding}>
            {children}
          </Container>
        </ScrollView>
      );
    }

    return (
      <Container padding={padding} style={styles.content}>
        {children}
      </Container>
    );
  };

  // Render with or without SafeAreaView
  const ScreenWrapper = safeArea ? SafeAreaView : View;

  return (
    <ScreenWrapper
      style={containerStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />
      
      {/* Header */}
      {(title || showBackButton || headerActions) && (
        <Header
          title={title}
          subtitle={subtitle}
          showBackButton={showBackButton}
          onBackPress={onBackPress}
          rightActions={headerActions}
          backgroundColor={bgColor}
          elevation={scrollable}
        />
      )}

      {/* Content */}
      {renderContent()}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenTemplate;
