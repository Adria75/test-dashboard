import { supabase } from './supabase'

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `uploads/${fileName}`

  const { error } = await supabase.storage
    .from('card-images')
    .upload(path, file)

  if (error) throw error

  const { data } = supabase.storage
    .from('card-images')
    .getPublicUrl(path)

  return data.publicUrl
}
