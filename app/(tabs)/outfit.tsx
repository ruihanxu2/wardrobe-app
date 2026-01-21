import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useClothingItems } from '@/lib/queries';
import { ClothingItem } from '@/types';

type SlotType = 'top' | 'bottom' | 'shoes';

const SLOT_CATEGORIES: Record<SlotType, string[]> = {
  top: ['Tops', 'Outerwear'],
  bottom: ['Bottoms', 'Dresses'],
  shoes: ['Shoes'],
};

export default function OutfitScreen() {
  const { data: items, isLoading } = useClothingItems();

  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<ClothingItem | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotType | null>(null);

  const openPicker = (slot: SlotType) => {
    setActiveSlot(slot);
    setModalVisible(true);
  };

  const selectItem = (item: ClothingItem) => {
    if (activeSlot === 'top') setSelectedTop(item);
    if (activeSlot === 'bottom') setSelectedBottom(item);
    if (activeSlot === 'shoes') setSelectedShoes(item);
    setModalVisible(false);
  };

  const clearSlot = (slot: SlotType) => {
    if (slot === 'top') setSelectedTop(null);
    if (slot === 'bottom') setSelectedBottom(null);
    if (slot === 'shoes') setSelectedShoes(null);
  };

  const getFilteredItems = () => {
    if (!items || !activeSlot) return [];
    const categories = SLOT_CATEGORIES[activeSlot];
    return items.filter(item => categories.includes(item.category));
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Human Figure with Clothing Slots */}
      <View style={styles.figureContainer}>
        {/* Head */}
        <View style={styles.head} />

        {/* Body/Torso - Top Slot */}
        <TouchableOpacity
          style={styles.topSlot}
          onPress={() => openPicker('top')}
          onLongPress={() => clearSlot('top')}
        >
          {selectedTop ? (
            <Image source={{ uri: selectedTop.image_url }} style={styles.slotImage} />
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.slotLabel}>Top</Text>
              <Text style={styles.slotHint}>Tap to add</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Legs - Bottom Slot */}
        <TouchableOpacity
          style={styles.bottomSlot}
          onPress={() => openPicker('bottom')}
          onLongPress={() => clearSlot('bottom')}
        >
          {selectedBottom ? (
            <Image source={{ uri: selectedBottom.image_url }} style={styles.slotImage} />
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.slotLabel}>Bottom</Text>
              <Text style={styles.slotHint}>Tap to add</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Feet - Shoes Slot */}
        <TouchableOpacity
          style={styles.shoesSlot}
          onPress={() => openPicker('shoes')}
          onLongPress={() => clearSlot('shoes')}
        >
          {selectedShoes ? (
            <Image source={{ uri: selectedShoes.image_url }} style={styles.slotImage} />
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.slotLabel}>Shoes</Text>
              <Text style={styles.slotHint}>Tap to add</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Long press to remove an item</Text>

      {/* Item Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {activeSlot === 'top' ? 'Top' : activeSlot === 'bottom' ? 'Bottom' : 'Shoes'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          {getFilteredItems().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items in this category</Text>
              <Text style={styles.emptySubtext}>Add some items to your wardrobe first</Text>
            </View>
          ) : (
            <FlatList
              data={getFilteredItems()}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => selectItem(item)}
                >
                  <Image source={{ uri: item.image_url }} style={styles.gridImage} />
                  <Text style={styles.gridLabel} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  figureContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  head: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  topSlot: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    overflow: 'hidden',
  },
  bottomSlot: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    overflow: 'hidden',
  },
  shoesSlot: {
    width: 100,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  slotLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  slotHint: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  slotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  grid: {
    padding: 8,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    maxWidth: '33%',
  },
  gridImage: {
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  gridLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: '#333',
  },
});
