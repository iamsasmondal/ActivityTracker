export interface Profile {
  id: string; // auth.users id
  email: string;
  username?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null; // Null means 'Common' tag
  created_at?: string;
}

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  date: string; // YYYY-MM-DD
  category_id: string;
  tag_id?: string;
  image_id?: string;
  created_at?: string;
}
