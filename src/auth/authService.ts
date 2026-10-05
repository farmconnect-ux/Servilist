import { UserProfile } from '../types';

export interface AuthUser extends UserProfile {
  email?: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin' | 'user';
}

export const TEST_USERS: AuthUser[] = [
  {
    id: 'usr-lagos-kofi',
    name: 'Kofi Mensah',
    displayName: 'Kofi Mensah',
    avatar: 'KM',
    email: 'kofi.mensah@servilist.africa',
    phone: '+2348012345678',
    city: 'Lagos, Nigeria',
    country: 'Nigeria',
    rating: 4.9,
    reviewsCount: 38,
    verified: true,
    role: 'seller',
  },
  {
    id: 'usr-nairobi-amina',
    name: 'Amina Diallo',
    displayName: 'Amina Diallo',
    avatar: 'AD',
    email: 'amina.diallo@servilist.africa',
    phone: '+254701234567',
    city: 'Nairobi, Kenya',
    country: 'Kenya',
    rating: 4.8,
    reviewsCount: 24,
    verified: true,
    role: 'buyer',
  },
  {
    id: 'usr-accra-kwame',
    name: 'Kwame Boateng',
    displayName: 'Kwame Boateng',
    avatar: 'KB',
    email: 'kwame.boateng@servilist.africa',
    phone: '+233241234567',
    city: 'Accra, Ghana',
    country: 'Ghana',
    rating: 4.7,
    reviewsCount: 15,
    verified: true,
    role: 'user',
  },
  {
    id: 'usr-admin-zola',
    name: 'Zola Khumalo (Admin)',
    displayName: 'Zola Khumalo (Admin)',
    avatar: 'ZK',
    email: 'admin@servilist.africa',
    phone: '+27821234567',
    city: 'Johannesburg, South Africa',
    country: 'South Africa',
    rating: 5.0,
    reviewsCount: 120,
    verified: true,
    role: 'admin',
  },
];

const STORAGE_KEY_USER = 'servilist_current_user';

type AuthListener = (user: AuthUser) => void;

export class AuthService {
  private currentUser: AuthUser;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.currentUser = this.loadInitialUser();
  }

  private loadInitialUser(): AuthUser {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_USER);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.name) {
            return parsed;
          }
        }
      } catch {
        // Fallback
      }
    }
    // Default to first test user (Kofi Mensah in Lagos)
    return { ...TEST_USERS[0] };
  }

  public getCurrentUser(): AuthUser {
    return this.currentUser;
  }

  public setCurrentUser(user: AuthUser): void {
    this.currentUser = { ...user };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      } catch {
        // quota
      }
    }
    this.notifyListeners();
  }

  public switchUser(userId: string): AuthUser {
    const match = TEST_USERS.find((u) => u.id === userId);
    if (match) {
      this.setCurrentUser(match);
      return match;
    }
    throw new Error(`User ID ${userId} not found in available test profiles`);
  }

  public signInWithEmail(email: string): AuthUser {
    const cleanEmail = email.trim().toLowerCase();
    const existing = TEST_USERS.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (existing) {
      this.setCurrentUser(existing);
      return existing;
    }

    // Dynamic user for email
    const namePart = email.split('@')[0] || 'User';
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const initials = (namePart.slice(0, 2) || 'US').toUpperCase();

    const newUser: AuthUser = {
      id: `usr-email-${Date.now()}`,
      name: formattedName,
      displayName: formattedName,
      avatar: initials,
      email: cleanEmail,
      city: 'Lagos, Nigeria',
      country: 'Nigeria',
      rating: 5.0,
      reviewsCount: 1,
      verified: false,
      role: 'buyer',
    };

    this.setCurrentUser(newUser);
    return newUser;
  }

  public signInWithPhone(phone: string): AuthUser {
    const cleanPhone = phone.trim();
    const existing = TEST_USERS.find((u) => u.phone === cleanPhone);
    if (existing) {
      this.setCurrentUser(existing);
      return existing;
    }

    const lastDigits = cleanPhone.slice(-4) || '0000';
    const newUser: AuthUser = {
      id: `usr-phone-${Date.now()}`,
      name: `User (+${lastDigits})`,
      displayName: `User (+${lastDigits})`,
      avatar: '📱',
      phone: cleanPhone,
      city: 'Nairobi, Kenya',
      country: 'Kenya',
      rating: 5.0,
      reviewsCount: 0,
      verified: true,
      role: 'buyer',
    };

    this.setCurrentUser(newUser);
    return newUser;
  }

  public signUp(details: {
    name: string;
    email?: string;
    phone?: string;
    city: string;
    country: string;
    role?: 'buyer' | 'seller' | 'user';
  }): AuthUser {
    const initials =
      details.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'SU';

    const newUser: AuthUser = {
      id: `usr-reg-${Date.now()}`,
      name: details.name.trim(),
      displayName: details.name.trim(),
      avatar: initials,
      email: details.email?.trim(),
      phone: details.phone?.trim(),
      city: details.city,
      country: details.country,
      rating: 5.0,
      reviewsCount: 0,
      verified: false,
      role: details.role || 'user',
    };

    this.setCurrentUser(newUser);
    return newUser;
  }

  public signOut(): void {
    // Return to guest/test user 0
    this.setCurrentUser(TEST_USERS[0]);
  }

  public onAuthStateChange(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch (err) {
        console.error('Auth state listener error:', err);
      }
    }
  }
}
