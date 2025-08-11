/**
 * List Template Component
 * Reusable list with loading, empty states, and infinite scroll
 */

import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ListTemplateProps } from '../../types/components';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

const ListTemplate: React.FC<ListTemplateProps> = ({
  data,
  renderItem,
  keyExtractor,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.1,
  emptyState,
  header,
  footer,
  separator,
  numColumns = 1,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const theme = useTheme();

  // Default key extractor
  const defaultKeyExtractor = (item: any, index: number) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    return item.id?.toString() || index.toString();
  };

  // Default separator
  const defaultSeparator = () => <View style={styles.separator} />;

  // Default empty state
  const defaultEmptyState = () => (
    <EmptyState
      title='No items found'
      message='There are no items to display.'
      testID={`${testID}-empty`}
    />
  );

  // Render item wrapper
  const renderItemWrapper = ({ item, index }: { item: any; index: number }) => {
    return renderItem(item, index) as React.ReactElement;
  };

  // Show loading state for initial load
  if (loading && data.length === 0) {
    return (
      <LoadingState
        message='Loading items...'
        size='lg'
        testID={`${testID}-loading`}
      />
    );
  }

  // List styles
  const listStyles = [styles.list, style];

  return (
    <FlatList
      style={listStyles}
      data={data}
      renderItem={renderItemWrapper}
      keyExtractor={defaultKeyExtractor}
      numColumns={numColumns}
      showsVerticalScrollIndicator={false}
      // Refresh control
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
      // Infinite scroll
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      // Header and footer
      ListHeaderComponent={header}
      ListFooterComponent={
        loading && data.length > 0 ? (
          <View style={styles.footerLoading}>
            <LoadingState
              message='Loading more...'
              size='sm'
              testID={`${testID}-footer-loading`}
            />
          </View>
        ) : (
          footer
        )
      }
      // Empty state
      ListEmptyComponent={emptyState || defaultEmptyState}
      // Separator
      ItemSeparatorComponent={separator || defaultSeparator}
      // Accessibility
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      // Grid layout optimization
      key={numColumns}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'transparent',
  },
  footerLoading: {
    paddingVertical: 20,
  },
});

export default ListTemplate;
