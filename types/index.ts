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
    _id?: string;
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

export interface FeedItem {
    id: string;
    title: string;
    image: string;
    date_posted: string;
}

export interface FeedProfile {
    user: {
        first_name: string;
        last_name: string;
        pronouns?: string;
        email: string;
        phone?: string;
        bio: string;
        profileImageUrl: string;
        email_visible: boolean;
        phone_visible: boolean;
        locations: Locations[];
    };
    posts: {
        _id: string;
        name: string;
        description: string;
        photos: string[];
        date_posted: string;
    }[];
    tappedPostId: string;
}

export interface PostRecord {
    _id: string;
    post_title: string;
    user_id: string;
    photos: string[];
    description: string;
    date_posted: string;
    trade_history: object;
    incoming_offers: any[];
}

export interface OpenTradeItem {
    tradeId: string;
    gameId: string;
    type: string;
    post: Post | null;
}

// Pairs an offerer's profile with the gameId of their pending offer, so
// downstream components (ProfileDeck) never need to reverse-engineer which
// game a given group of cards belongs to.
export interface OffererGroup {
  gameId: string;
  profile: FeedProfile;
}