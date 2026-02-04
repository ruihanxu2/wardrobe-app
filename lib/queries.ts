import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { ClothingItem, ClothingItemInsert, ClothingItemUpdate } from '@/types';
import { useAuth } from './auth';
import { File } from 'expo-file-system/next';
import { decode } from 'base64-arraybuffer';

export function useClothingItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clothing-items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClothingItem[];
    },
    enabled: !!user,
  });
}

export function useClothingItem(id: string) {
  return useQuery({
    queryKey: ['clothing-item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ClothingItem;
    },
    enabled: !!id,
  });
}

export function useAddClothingItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ imageUri, ...item }: Omit<ClothingItemInsert, 'user_id' | 'image_url'> & { imageUri: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Detect if image is PNG (for transparency support) or JPEG
      const isPng = imageUri.toLowerCase().endsWith('.png') || imageUri.includes('extracted');
      const extension = isPng ? 'png' : 'jpg';
      const contentType = isPng ? 'image/png' : 'image/jpeg';

      // Upload image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.${extension}`;
      const file = new File(imageUri);
      const base64 = await file.base64();

      const { error: uploadError } = await supabase.storage
        .from('clothing-images')
        .upload(fileName, decode(base64), {
          contentType,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clothing-images')
        .getPublicUrl(fileName);

      // Insert item
      const { data, error } = await supabase
        .from('clothing_items')
        .insert({
          ...item,
          user_id: user.id,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ClothingItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing-items'] });
    },
  });
}

export function useUpdateClothingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClothingItemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('clothing_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ClothingItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clothing-items'] });
      queryClient.invalidateQueries({ queryKey: ['clothing-item', data.id] });
    },
  });
}

export function useDeleteClothingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string }) => {
      // Extract the file path from the public URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/clothing-images/[userId]/[timestamp].jpg
      const match = imageUrl.match(/clothing-images\/(.+)$/);
      if (match) {
        const filePath = match[1];
        await supabase.storage.from('clothing-images').remove([filePath]);
      }

      // Delete the item from the database
      const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing-items'] });
    },
  });
}
