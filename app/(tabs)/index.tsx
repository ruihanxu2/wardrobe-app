import { useState, useMemo } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useClothingItems } from '@/lib/queries';
import { CATEGORIES } from '@/constants/categories';

export default function InventoryScreen() {
  const router = useRouter();
  const { data: items, isLoading, error } = useClothingItems();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (!items) return [];

    let result = items;

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Filter by search (name or brand)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.brand && item.brand.toLowerCase().includes(query))
      );
    }

    return result;
  }, [items, selectedCategory, searchQuery]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load items</Text>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
        <Text style={styles.emptySubtitle}>Add your first item to get started</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add')}
        >
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasActiveFilters = selectedCategory !== 'All' || searchQuery.trim() !== '';

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or brand..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {['All', ...CATEGORIES].map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.tab, selectedCategory === category && styles.tabSelected]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.tabText, selectedCategory === category && styles.tabTextSelected]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid or Empty State */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyFilterContainer}>
          <Text style={styles.emptyFilterTitle}>No items found</Text>
          <Text style={styles.emptyFilterSubtitle}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Add items to your wardrobe'}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => router.push(`/item/${item.id}`)}
            >
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  tabSelected: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tabTextSelected: {
    color: '#fff',
  },
  emptyFilterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyFilterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyFilterSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    padding: 8,
  },
  itemCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
  },
});
