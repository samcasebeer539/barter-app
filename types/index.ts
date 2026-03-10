export interface Post {
  name: string;
  description: string;
  photos: string[];
}

export interface User {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  pronouns?: string;
  bio: string;
  profileImageUrl: string; 
  rating?: number;
  reviewCount?: number;
  email_visible: boolean;
  phone_visible: boolean;
}