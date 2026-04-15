export interface Post {
  _id?: string;
  name: string;
  description: string;
  photos: string[];
  date_posted: string;
}
export interface LocationEntry {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
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
  locations: LocationEntry[];
}

export interface Locations {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
}