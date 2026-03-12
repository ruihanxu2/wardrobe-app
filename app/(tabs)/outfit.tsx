import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Shirt, Footprints, Layers, Plus, ArrowRight, Hand, Trash2, ChevronUp, ChevronDown } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useClothingItems } from '@/lib/queries';
import { ClothingItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = 100;
const TRASH_ZONE_SIZE = 70;

// Custom Pants icon
const Pants = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16v4l-3 12h-3l-2-8-2 8H7L4 8V4z" />
  </Svg>
);

type SlotType = 'top' | 'bottom' | 'shoes' | 'canvas';

const SLOT_CATEGORIES: Record<SlotType, string[]> = {
  top: ['Tops', 'Outerwear'],
  bottom: ['Bottoms'],
  shoes: ['Shoes'],
  canvas: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Other'],
};

type CanvasItem = {
  id: string;
  item: ClothingItem;
  x: number;
  y: number;
  scale: number;
  zIndex: number;
};

// Draggable item using PanResponder
const DraggableItem = ({
  canvasItem,
  onUpdate,
  onDragStateChange,
  onDelete,
  onTap,
  onLongPress,
  isSelected,
  isInDeleteMode,
  canvasHeight,
}: {
  canvasItem: CanvasItem;
  onUpdate: (id: string, x: number, y: number, scale: number) => void;
  onDragStateChange: (isDragging: boolean, id: string) => void;
  onDelete: (id: string) => void;
  onTap: (id: string) => void;
  onLongPress: (id: string) => void;
  isSelected: boolean;
  isInDeleteMode: boolean;
  canvasHeight: number;
}) => {
  const pan = useRef(new Animated.ValueXY({ x: canvasItem.x, y: canvasItem.y })).current;
  const scaleAnim = useRef(new Animated.Value(canvasItem.scale)).current;
  const [isActive, setIsActive] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const currentScale = useRef(canvasItem.scale);
  const lastDistance = useRef(0);
  const startY = useRef(canvasItem.y);
  const hasMoved = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchActive = useRef(false);
  const dragNotified = useRef(false);

  // Use refs to avoid stale closures
  const canvasHeightRef = useRef(canvasHeight);
  const onDeleteRef = useRef(onDelete);
  const onUpdateRef = useRef(onUpdate);
  const onDragStateChangeRef = useRef(onDragStateChange);
  const onTapRef = useRef(onTap);
  const onLongPressRef = useRef(onLongPress);
  const itemIdRef = useRef(canvasItem.id);

  // Update refs when props change
  canvasHeightRef.current = canvasHeight;
  onDeleteRef.current = onDelete;
  onUpdateRef.current = onUpdate;
  onDragStateChangeRef.current = onDragStateChange;
  onTapRef.current = onTap;
  onLongPressRef.current = onLongPress;
  itemIdRef.current = canvasItem.id;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsActive(true);
        hasMoved.current = false;
        isTouchActive.current = true;
        dragNotified.current = false;
        startY.current = (pan.y as any)._value;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });

        // Start long press timer - only trigger if touch still active after 500ms
        longPressTimer.current = setTimeout(() => {
          if (!hasMoved.current && isTouchActive.current) {
            onLongPressRef.current(itemIdRef.current);
          }
        }, 500);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Check if moved enough to cancel tap/long press and start dragging
        if (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10) {
          hasMoved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          // Notify drag started only once
          if (!dragNotified.current) {
            dragNotified.current = true;
            onDragStateChangeRef.current(true, itemIdRef.current);
          }
        }

        // Handle pinch zoom with two fingers
        if (evt.nativeEvent.touches.length === 2) {
          hasMoved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );

          if (lastDistance.current > 0) {
            const scaleFactor = distance / lastDistance.current;
            const newScale = Math.min(Math.max(currentScale.current * scaleFactor, 0.5), 2.5);
            scaleAnim.setValue(newScale);
            currentScale.current = newScale;
          }
          lastDistance.current = distance;
        } else {
          lastDistance.current = 0;
          // Single finger drag
          Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gestureState);

          // Check if visual bottom of item hits trash icon
          const currentY = startY.current + gestureState.dy;
          const visualBottom = currentY + ITEM_SIZE * (1 + currentScale.current) / 2;
          const trashTop = canvasHeightRef.current - 80;
          setIsOverTrash(visualBottom > trashTop + 20);
        }
      },
      onPanResponderRelease: () => {
        // Mark touch as inactive FIRST to prevent timer from firing
        isTouchActive.current = false;

        // Clear long press timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        pan.flattenOffset();
        setIsActive(false);
        lastDistance.current = 0;

        const finalX = (pan.x as any)._value;
        const finalY = (pan.y as any)._value;

        // If didn't move, treat as tap
        if (!hasMoved.current) {
          onTapRef.current(itemIdRef.current);
          onDragStateChangeRef.current(false, itemIdRef.current);
          return;
        }

        // Check if visual bottom of item hits trash icon
        const visualBottom = finalY + ITEM_SIZE * (1 + currentScale.current) / 2;
        const trashTop = canvasHeightRef.current - 80;

        if (visualBottom > trashTop + 20) {
          onDeleteRef.current(itemIdRef.current);
        } else {
          onUpdateRef.current(itemIdRef.current, finalX, finalY, currentScale.current);
        }

        setIsOverTrash(false);
        onDragStateChangeRef.current(false, itemIdRef.current);
      },
      onPanResponderTerminate: () => {
        // Touch was interrupted - clean up
        isTouchActive.current = false;
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        pan.flattenOffset();
        setIsActive(false);
        setIsOverTrash(false);
        lastDistance.current = 0;
        onDragStateChangeRef.current(false, itemIdRef.current);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.canvasItem,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim },
          ],
          zIndex: isActive ? 1000 : canvasItem.zIndex,
          opacity: isInDeleteMode ? 0.5 : 1,
        },
        (isActive || isSelected) && styles.canvasItemSelected,
        isOverTrash && styles.canvasItemOverTrash,
      ]}
      {...panResponder.panHandlers}
    >
      <Image source={{ uri: canvasItem.item.image_url }} style={styles.canvasItemImage} />
    </Animated.View>
  );
};

export default function OutfitScreen() {
  const { data: items, isLoading } = useClothingItems();

  // Layered mode state
  const [topLayers, setTopLayers] = useState<(ClothingItem | null)[]>([null]);
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<ClothingItem | null>(null);

  // Canvas mode state
  const [isFreeformMode, setIsFreeformMode] = useState(false);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const nextZIndex = useRef(1);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotType | null>(null);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);

  const openPicker = (slot: SlotType, layerIndex: number = 0) => {
    setActiveSlot(slot);
    setActiveLayerIndex(layerIndex);
    setModalVisible(true);
  };

  const selectItem = (item: ClothingItem) => {
    if (activeSlot === 'top') {
      const newLayers = [...topLayers];
      newLayers[activeLayerIndex] = item;
      setTopLayers(newLayers);
    } else if (activeSlot === 'bottom') {
      setSelectedBottom(item);
    } else if (activeSlot === 'shoes') {
      setSelectedShoes(item);
    } else if (activeSlot === 'canvas') {
      const newCanvasItem: CanvasItem = {
        id: `${item.id}-${Date.now()}`,
        item,
        x: (SCREEN_WIDTH - ITEM_SIZE) / 2 - 16,
        y: 100,
        scale: 1,
        zIndex: nextZIndex.current++,
      };
      setCanvasItems([...canvasItems, newCanvasItem]);
    }
    setModalVisible(false);
  };

  const clearSlot = (slot: SlotType, layerIndex: number = 0) => {
    if (slot === 'top') {
      const newLayers = [...topLayers];
      newLayers[layerIndex] = null;
      setTopLayers(newLayers);
    } else if (slot === 'bottom') {
      setSelectedBottom(null);
    } else if (slot === 'shoes') {
      setSelectedShoes(null);
    }
  };

  const addLayer = () => {
    if (topLayers.length < 4) {
      setTopLayers([...topLayers, null]);
    }
  };

  const removeLayer = (index: number) => {
    if (topLayers.length > 1) {
      const newLayers = topLayers.filter((_, i) => i !== index);
      setTopLayers(newLayers);
    }
  };

  const updateCanvasItem = (id: string, x: number, y: number, scale: number) => {
    setCanvasItems(prev =>
      prev.map(item => (item.id === id ? { ...item, x, y, scale } : item))
    );
  };

  const handleDragStateChange = (dragging: boolean, _id: string) => {
    setIsDragging(dragging);
  };

  const handleDelete = (id: string) => {
    setCanvasItems(prev => prev.filter(item => item.id !== id));
    setSelectedItemId(null);
    setDeleteItemId(null);
  };

  const handleTap = (id: string) => {
    if (deleteItemId) {
      setDeleteItemId(null);
    }
    setSelectedItemId(prev => (prev === id ? null : id));
  };

  const handleLongPress = (id: string) => {
    setSelectedItemId(null);
    setDeleteItemId(id);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      handleDelete(deleteItemId);
    }
  };

  const moveLayerUp = () => {
    if (!selectedItemId) return;
    setCanvasItems(prev => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(item => item.id === selectedItemId);
      if (idx < sorted.length - 1) {
        const currentZ = sorted[idx].zIndex;
        const aboveZ = sorted[idx + 1].zIndex;
        return prev.map(item => {
          if (item.id === selectedItemId) return { ...item, zIndex: aboveZ };
          if (item.id === sorted[idx + 1].id) return { ...item, zIndex: currentZ };
          return item;
        });
      }
      return prev;
    });
  };

  const moveLayerDown = () => {
    if (!selectedItemId) return;
    setCanvasItems(prev => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(item => item.id === selectedItemId);
      if (idx > 0) {
        const currentZ = sorted[idx].zIndex;
        const belowZ = sorted[idx - 1].zIndex;
        return prev.map(item => {
          if (item.id === selectedItemId) return { ...item, zIndex: belowZ };
          if (item.id === sorted[idx - 1].id) return { ...item, zIndex: currentZ };
          return item;
        });
      }
      return prev;
    });
  };

  const getFilteredItems = () => {
    if (!items || !activeSlot) return [];
    const categories = SLOT_CATEGORIES[activeSlot];
    return items.filter(item => categories.includes(item.category));
  };

  const getSlotTitle = () => {
    if (activeSlot === 'top') return `Layer ${activeLayerIndex + 1}`;
    if (activeSlot === 'bottom') return 'Bottom';
    if (activeSlot === 'shoes') return 'Shoes';
    if (activeSlot === 'canvas') return 'Add Item';
    return '';
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
      {/* Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, !isFreeformMode && styles.modeButtonActive]}
            onPress={() => setIsFreeformMode(false)}
          >
            <Layers size={18} color={!isFreeformMode ? '#fff' : '#666'} />
            <Text style={[styles.modeButtonText, !isFreeformMode && styles.modeButtonTextActive]}>
              Layers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, isFreeformMode && styles.modeButtonActive]}
            onPress={() => setIsFreeformMode(true)}
          >
            <Hand size={18} color={isFreeformMode ? '#fff' : '#666'} />
            <Text style={[styles.modeButtonText, isFreeformMode && styles.modeButtonTextActive]}>
              Freeform
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isFreeformMode ? (
        /* Freeform Canvas Mode */
        <View style={styles.canvasContainer}>
          <View
            style={styles.canvas}
            onLayout={(e) => {
              setCanvasHeight(e.nativeEvent.layout.height);
            }}
          >
            {canvasItems.length === 0 ? (
              <View style={styles.canvasEmpty}>
                <Hand size={40} color="#ccc" />
                <Text style={styles.canvasEmptyText}>Tap + to add clothes</Text>
                <Text style={styles.canvasEmptyHint}>Pinch to resize • Drag down to delete</Text>
              </View>
            ) : (
              <>
                {canvasItems.map(canvasItem => (
                  <DraggableItem
                    key={canvasItem.id}
                    canvasItem={canvasItem}
                    onUpdate={updateCanvasItem}
                    onDragStateChange={handleDragStateChange}
                    onDelete={handleDelete}
                    onTap={handleTap}
                    onLongPress={handleLongPress}
                    isSelected={selectedItemId === canvasItem.id}
                    isInDeleteMode={deleteItemId === canvasItem.id}
                    canvasHeight={canvasHeight}
                  />
                ))}

                {/* Controls inside canvas at bottom */}
                {deleteItemId ? (
                  <TouchableOpacity style={styles.canvasInnerDelete} onPress={confirmDelete}>
                    <Trash2 size={24} color="#fff" />
                  </TouchableOpacity>
                ) : selectedItemId ? (
                  <View style={styles.canvasInnerControls}>
                    <TouchableOpacity style={styles.layerButton} onPress={moveLayerDown}>
                      <ChevronDown size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.layerButton} onPress={moveLayerUp}>
                      <ChevronUp size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            )}

            {/* Trash zone indicator at bottom of canvas when dragging */}
            {isDragging && (
              <View style={styles.trashIndicator}>
                <Trash2 size={28} color="#ff3b30" />
              </View>
            )}
          </View>

          {/* Add button */}
          <View style={styles.canvasControls}>
            <TouchableOpacity
              style={styles.canvasAddButton}
              onPress={() => openPicker('canvas')}
            >
              <Plus size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Layered Mode */
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.figureContainer}>
            <View style={styles.head} />

            <View style={styles.layersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.layersScroll}
              >
                {topLayers.map((layer, index) => (
                  <View key={index} style={styles.layerWrapper}>
                    <TouchableOpacity
                      style={styles.layerSlot}
                      onPress={() => openPicker('top', index)}
                      onLongPress={() => clearSlot('top', index)}
                    >
                      {layer ? (
                        <Image source={{ uri: layer.image_url }} style={styles.slotImage} />
                      ) : (
                        <View style={styles.emptySlot}>
                          <Shirt size={28} color="#ccc" />
                        </View>
                      )}
                    </TouchableOpacity>
                    {index < topLayers.length - 1 && (
                      <View style={styles.layerArrow}>
                        <ArrowRight size={16} color="#ccc" />
                      </View>
                    )}
                  </View>
                ))}
                {topLayers.length < 4 && (
                  <TouchableOpacity style={styles.addLayerButton} onPress={addLayer}>
                    <Plus size={24} color="#999" />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.bottomSlot}
              onPress={() => openPicker('bottom')}
              onLongPress={() => clearSlot('bottom')}
            >
              {selectedBottom ? (
                <Image source={{ uri: selectedBottom.image_url }} style={styles.slotImage} />
              ) : (
                <View style={styles.emptySlot}>
                  <Pants size={28} color="#ccc" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shoesSlot}
              onPress={() => openPicker('shoes')}
              onLongPress={() => clearSlot('shoes')}
            >
              {selectedShoes ? (
                <Image source={{ uri: selectedShoes.image_url }} style={styles.slotImage} />
              ) : (
                <View style={styles.emptySlot}>
                  <Footprints size={24} color="#ccc" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Long press to remove an item</Text>
        </ScrollView>
      )}

      {/* Item Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getSlotTitle()}</Text>
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
              keyExtractor={item => item.id}
              numColumns={3}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.gridItem} onPress={() => selectItem(item)}>
                  <Image source={{ uri: item.image_url }} style={styles.gridImage} />
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {item.name}
                  </Text>
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
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modeToggleContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#000',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  figureContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  head: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  layersContainer: {
    width: '100%',
    marginBottom: 12,
  },
  layersScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  layerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layerSlot: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  layerArrow: {
    marginHorizontal: 8,
  },
  addLayerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  bottomSlot: {
    width: 120,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
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
  slotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
  },
  // Canvas styles
  canvasContainer: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#fafafa',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  canvasEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ccc',
    marginTop: 12,
  },
  canvasEmptyHint: {
    fontSize: 13,
    color: '#ddd',
    marginTop: 4,
  },
  canvasItem: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  canvasItemSelected: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  canvasItemOverTrash: {
    borderColor: '#ff3b30',
  },
  canvasInnerControls: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 999,
  },
  canvasInnerDelete: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    left: '50%',
    marginLeft: -28,
  },
  layerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  canvasItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  trashIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,59,48,0.15)',
    width: 60,
    height: 60,
    borderRadius: 30,
    left: '50%',
    marginLeft: -30,
  },
  canvasControls: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  canvasAddButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  // Modal styles
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
