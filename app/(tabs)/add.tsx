import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useAddClothingItem } from '@/lib/queries';
import { CATEGORIES, COLORS, OCCASIONS } from '@/constants/categories';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GALLERY_ITEM_SIZE = SCREEN_WIDTH / 4;

// Color values for visual color picker
const COLOR_VALUES: Record<string, string> = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Gray': '#808080',
  'Navy': '#001F3F',
  'Blue': '#0074D9',
  'Red': '#FF4136',
  'Pink': '#FF69B4',
  'Green': '#2ECC40',
  'Yellow': '#FFDC00',
  'Orange': '#FF851B',
  'Purple': '#B10DC9',
  'Brown': '#8B4513',
  'Beige': '#F5F5DC',
  'Multi': 'multi',
};

const STEP_LABELS = ['Photo', 'Category', 'Details'];

interface GalleryAsset {
  id: string;
  uri: string;
}

export default function AddItemScreen() {
  const router = useRouter();
  const addItem = useAddClothingItem();

  // Step state
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [occasion, setOccasion] = useState<string[]>([]);
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');

  // Gallery state
  const [galleryAssets, setGalleryAssets] = useState<GalleryAsset[]>([]);
  const [galleryPermission, setGalleryPermission] = useState<boolean | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // Load gallery on mount
  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoadingGallery(true);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setGalleryPermission(status === 'granted');

    if (status === 'granted') {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 50,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      // Get localUri for each asset (ph:// URIs don't work with Image component)
      const assetsWithLocalUri = await Promise.all(
        media.assets.map(async (asset) => {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
          return {
            id: asset.id,
            uri: assetInfo.localUri || asset.uri,
          };
        })
      );

      setGalleryAssets(assetsWithLocalUri);

      // Auto-select first image if no image selected yet
      if (!imageUri && assetsWithLocalUri.length > 0) {
        setImageUri(assetsWithLocalUri[0].uri);
      }
    }
    setLoadingGallery(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permission to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please add a photo');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!color) {
      Alert.alert('Error', 'Please select a color');
      return;
    }

    try {
      await addItem.mutateAsync({
        imageUri,
        name: name.trim(),
        category,
        color,
        occasion: occasion.length > 0 ? occasion : null,
        brand: brand.trim() || null,
        notes: notes.trim() || null,
      });

      Alert.alert('Success', 'Item added to your wardrobe!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') },
      ]);
    } catch (error: any) {
      console.error('Add item error:', error);
      Alert.alert('Error', error?.message || 'Failed to add item. Please try again.');
    }
  };

  // Navigation validation
  const canProceedFromStep1 = !!imageUri;
  const canProceedFromStep2 = !!category && !!color;
  const canSave = !!name.trim();

  const handleNext = () => {
    if (step === 1 && !canProceedFromStep1) {
      Alert.alert('Photo Required', 'Please select a photo to continue');
      return;
    }
    if (step === 2 && !canProceedFromStep2) {
      Alert.alert('Selection Required', 'Please select both category and color');
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Progress Indicator Component
  const ProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressDots}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              s <= step && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressLabel}>{STEP_LABELS[step - 1]}</Text>
    </View>
  );

  // Gallery item renderer
  const renderGalleryItem = ({ item, index }: { item: GalleryAsset | 'camera'; index: number }) => {
    if (item === 'camera') {
      return (
        <TouchableOpacity style={styles.galleryItem} onPress={takePhoto}>
          <View style={styles.cameraButton}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraText}>Camera</Text>
          </View>
        </TouchableOpacity>
      );
    }

    const isSelected = imageUri === item.uri;
    return (
      <TouchableOpacity
        style={styles.galleryItem}
        onPress={() => setImageUri(item.uri)}
      >
        <Image source={{ uri: item.uri }} style={styles.galleryImage} />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectedCheck}>
              <Text style={styles.selectedCheckText}>✓</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Step 1: Photo (Instagram-style)
  const renderPhotoStep = () => {
    const galleryData: (GalleryAsset | 'camera')[] = ['camera', ...galleryAssets];

    return (
      <View style={styles.stepContainer}>
        {/* Preview area - top 55% */}
        <View style={styles.previewArea}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              {loadingGallery ? (
                <ActivityIndicator size="large" color="#000" />
              ) : galleryPermission === false ? (
                <>
                  <Text style={styles.placeholderText}>Gallery access needed</Text>
                  <TouchableOpacity style={styles.permissionButton} onPress={loadGallery}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.placeholderText}>Select a photo below</Text>
              )}
            </View>
          )}
        </View>

        {/* Gallery grid - bottom 45% */}
        <View style={styles.galleryArea}>
          <FlatList
            data={galleryData}
            renderItem={renderGalleryItem}
            keyExtractor={(item, index) => (item === 'camera' ? 'camera' : item.id)}
            numColumns={4}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.galleryGrid}
          />
        </View>

        {/* Next button */}
        <View style={styles.photoNavigation}>
          <TouchableOpacity
            style={[styles.nextButton, !canProceedFromStep1 && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceedFromStep1}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Color Circle Component
  const ColorCircle = ({ colorName }: { colorName: string }) => {
    const isSelected = color === colorName;
    const colorValue = COLOR_VALUES[colorName];
    const isWhite = colorName === 'White';
    const isMulti = colorName === 'Multi';

    return (
      <TouchableOpacity
        style={styles.colorCircleContainer}
        onPress={() => setColor(colorName)}
      >
        <View
          style={[
            styles.colorCircle,
            isMulti ? styles.colorCircleMulti : { backgroundColor: colorValue },
            isWhite && styles.colorCircleWhiteBorder,
            isSelected && styles.colorCircleSelected,
          ]}
        >
          {isSelected && (
            <Text style={[styles.checkmark, isWhite && styles.checkmarkDark]}>
              ✓
            </Text>
          )}
        </View>
        <Text style={styles.colorLabel}>{colorName}</Text>
      </TouchableOpacity>
    );
  };

  // Step 2: Essentials (Category + Color)
  const renderEssentialsStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.stepContent}>
      <Text style={styles.sectionLabel}>Category</Text>
      <View style={styles.chipContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipSelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Color</Text>
      <View style={styles.colorGrid}>
        {COLORS.map((col) => (
          <ColorCircle key={col} colorName={col} />
        ))}
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.navButton} onPress={handleBack}>
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary, !canProceedFromStep2 && styles.navButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceedFromStep2}
        >
          <Text style={styles.navButtonPrimaryText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Step 3: Details
  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.stepContent}>
      <Text style={styles.sectionLabel}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Blue Oxford Shirt"
        placeholderTextColor="#999"
      />

      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Occasion (optional)</Text>
      <View style={styles.chipContainer}>
        {OCCASIONS.map((occ) => (
          <TouchableOpacity
            key={occ}
            style={[styles.chip, occasion.includes(occ) && styles.chipSelected]}
            onPress={() => {
              setOccasion((prev) =>
                prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
              );
            }}
          >
            <Text style={[styles.chipText, occasion.includes(occ) && styles.chipTextSelected]}>
              {occ}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Brand (optional)</Text>
      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
        placeholder="e.g., Nike, Zara"
        placeholderTextColor="#999"
      />

      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add any notes..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
      />

      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.navButton} onPress={handleBack}>
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary, (!canSave || addItem.isPending) && styles.navButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave || addItem.isPending}
        >
          {addItem.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.navButtonPrimaryText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ProgressIndicator />
      {step === 1 && renderPhotoStep()}
      {step === 2 && renderEssentialsStep()}
      {step === 3 && renderDetailsStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: '#000',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // Step 1: Photo styles (Instagram-style)
  previewArea: {
    height: SCREEN_HEIGHT * 0.40,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  permissionButton: {
    marginTop: 16,
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  galleryArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  galleryGrid: {
    paddingBottom: 80,
  },
  galleryItem: {
    width: GALLERY_ITEM_SIZE,
    height: GALLERY_ITEM_SIZE,
    padding: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  cameraText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  nextButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Navigation buttons
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  navButtonPrimary: {
    backgroundColor: '#000',
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Form styles
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  chipSelected: {
    backgroundColor: '#000',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  // Color picker styles
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  colorCircleContainer: {
    alignItems: 'center',
    width: 60,
    marginBottom: 8,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleMulti: {
    backgroundColor: '#ccc',
    borderWidth: 2,
    borderColor: '#FF4136',
    overflow: 'hidden',
  },
  colorCircleWhiteBorder: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  colorLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkmarkDark: {
    color: '#000',
  },
  // Input styles
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
