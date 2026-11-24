export interface Post {
    _id?: string;
    name: string;
    description: string;
    photos: string[];
    date_posted: string;
    /** Your post is in an active trade, so it can't be edited. */
    inTrade?: boolean;
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
        _id?: string;
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
        rating?: number;
        reviewCount?: number;
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
    in_trade?: boolean;
}

export interface OpenTradeItem {
    tradeId: string;
    gameId: string;
    type: string;
    post: Post | null;
    actorId?: string;
    messages?: QueryMessage[];
    /** Declined offers: the game's raw turns (oldest first), your id and the other player's first name, for the turn log. */
    rawTurns?: any[];
    myId?: string;
    partnerName?: string;
}

// Pairs an offerer's profile with the gameId of their pending offer, so
// downstream components (ProfileDeck) never need to reverse-engineer which
// game a given group of cards belongs to.
export interface OffererGroup {
  gameId: string;
  profile: FeedProfile;
}

export interface QueryMessage {
  message: string;
  senderId: string;
  createdAt: string;
}
