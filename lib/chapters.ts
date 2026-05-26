import { supabase } from './supabase';

export interface ChapterRow {
  id: string;
  user_id: string;
  n: number;
  title: string;
  body: string;
  words: number;
  status: 'draft' | 'styled' | 'new';
  updated_at: string;
  created_at: string;
}

export async function fetchChapters(userId: string): Promise<ChapterRow[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('user_id', userId)
    .order('n', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertChapter(chapter: Partial<ChapterRow> & { user_id: string; n: number }): Promise<ChapterRow> {
  const words = chapter.body ? chapter.body.trim().split(/\s+/).filter(Boolean).length : 0;
  const { data, error } = await supabase
    .from('chapters')
    .upsert({ ...chapter, words, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createChapter(userId: string, n: number, title: string): Promise<ChapterRow> {
  const { data, error } = await supabase
    .from('chapters')
    .insert({ user_id: userId, n, title, body: '', words: 0, status: 'new' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChapter(id: string): Promise<void> {
  const { error } = await supabase.from('chapters').delete().eq('id', id);
  if (error) throw error;
}
