import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useClothingItem, useUpdateClothingItem, useDeleteClothingItem } from '@/lib/queries';
import { CATEGORIES, COLORS } from '@/constants/categories';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: item, isLoading, error } = useClothingItem(id);
  const updateItem = useUpdateClothingItem();
  const deleteItem = useDeleteClothingItem();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const startEditing = () => {
    if (!item) return;
    setEditName(item.name);
    setEditCategory(item.category);
    setEditColor(item.color || '');
    setEditBrand(item.brand || '');
    setEditNotes(item.notes || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!editCategory) {
      Alert.alert('Error', 'Category is required');
      return;
    }

    try {
      await updateItem.mutateAsync({
        id,
        name: editName.trim(),
        category: editCategory,
        color: editColor || undefined,
        brand: editBrand.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem.mutateAsync({ id, imageUrl: item?.image_url || '' });
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load item</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Item' : item.name,
          headerRight: () =>
            !isEditing ? (
              <TouchableOpacity onPress={startEditing}>
                <Text style={styles.headerButton}>Edit</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Image source={{ uri: item.image_url }} style={styles.image} />

        {isEditing ? (
          <View style={styles.form}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Item name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.chipContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, editCategory === cat && styles.chipSelected]}
                  onPress={() => setEditCategory(cat)}
                >
                  <Text style={[styles.chipText, editCategory === cat && styles.chipTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Color</Text>
            <View style={styles.chipContainer}>
              {COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[styles.chip, editColor === col && styles.chipSelected]}
                  onPress={() => setEditColor(col)}
                >
                  <Text style={[styles.chipText, editColor === col && styles.chipTextSelected]}>
                    {col}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={editBrand}
              onChangeText={setEditBrand}
              placeholder="Brand (optional)"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Notes (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, updateItem.isPending && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={updateItem.isPending}
              >
                {updateItem.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{item.category}</Text>
            </View>

            {item.color && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Color</Text>
                <Text style={styles.detailValue}>{item.color}</Text>
              </View>
            )}

            {item.brand && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brand</Text>
                <Text style={styles.detailValue}>{item.brand}</Text>
              </View>
            )}

            {item.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{item.notes}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Added</Text>
              <Text style={styles.detailValue}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending ? (
                <ActivityIndicator color="#ff3b30" size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Item</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerButton: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
  },
  details: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  deleteButton: {
    marginTop: 32,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
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
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
});
