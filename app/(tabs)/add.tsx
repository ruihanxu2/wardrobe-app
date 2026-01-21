import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAddClothingItem } from '@/lib/queries';
import { CATEGORIES, COLORS } from '@/constants/categories';

export default function AddItemScreen() {
  const router = useRouter();
  const addItem = useAddClothingItem();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please grant permission to access your photos');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image Section */}
      <View style={styles.imageSection}>
        {imageUri ? (
          <TouchableOpacity onPress={() => setImageUri(null)}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <Text style={styles.tapToChange}>Tap to change</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.imageButtons}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage(true)}
              >
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => pickImage(false)}
              >
                <Text style={styles.imageButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Blue Oxford Shirt"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Category *</Text>
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

        <Text style={styles.label}>Color *</Text>
        <View style={styles.chipContainer}>
          {COLORS.map((col) => (
            <TouchableOpacity
              key={col}
              style={[styles.chip, color === col && styles.chipSelected]}
              onPress={() => setColor(col)}
            >
              <Text style={[styles.chipText, color === col && styles.chipTextSelected]}>
                {col}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Brand (optional)</Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g., Nike, Zara"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.saveButton, addItem.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={addItem.isPending}
        >
          {addItem.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Add to Wardrobe</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  imagePlaceholder: {
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtons: {
    gap: 12,
  },
  imageButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  tapToChange: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
