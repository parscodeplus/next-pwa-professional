// // src/lib/locationUtils.ts
'use client';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface AddressData {
  country: string;
  city: string;
  district: string;
  street: string;
  postalCode: string;
  formattedAddress: string;
}

export type LocationError = 
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface LocationErrorInfo {
  code: LocationError;
  message: string;
}



// تبدیل خطاهای Geolocation API به فرمت یکسان
export function formatLocationError(error: GeolocationPositionError): LocationErrorInfo {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        code: 'PERMISSION_DENIED',
        message: 'دسترسی به موقعیت مکانی شما رد شد. لطفاً دسترسی را فعال کنید.',
      };
    case error.POSITION_UNAVAILABLE:
      return {
        code: 'POSITION_UNAVAILABLE',
        message: 'موقعیت مکانی در دسترس نیست. لطفاً دوباره تلاش کنید.',
      };
    case error.TIMEOUT:
      return {
        code: 'TIMEOUT',
        message: 'زمان درخواست موقعیت مکانی به پایان رسید. لطفاً دوباره تلاش کنید.',
      };
    default:
      return {
        code: 'UNKNOWN_ERROR',
        message: 'خطای ناشناخته در دریافت موقعیت مکانی رخ داد.',
      };
  }
}

// تبدیل مختصات به آدرس (با استفاده از Nominatim API)
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<AddressData | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=fa`
    );
    const data = await response.json();
    
    if (data && data.address) {
      return {
        country: data.address.country || '',
        city: data.address.city || data.address.town || data.address.village || '',
        district: data.address.suburb || data.address.neighbourhood || '',
        street: data.address.road || '',
        postalCode: data.address.postcode || '',
        formattedAddress: data.display_name || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// محاسبه فاصله بین دو نقطه (به کیلومتر)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // شعاع زمین به کیلومتر
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// بررسی اینکه آیا کاربر در محدوده مشخصی است
export function isWithinRadius(
  userLat: number,
  userLon: number,
  centerLat: number,
  centerLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(userLat, userLon, centerLat, centerLon);
  return distance <= radiusKm;
}

// ذخیره موقعیت در localStorage
export function saveLocationToCache(location: LocationData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cached_location', JSON.stringify({
      ...location,
      cachedAt: Date.now(),
    }));
  }
}

// بازیابی موقعیت از cache
export function getLocationFromCache(): (LocationData & { cachedAt: number }) | null {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('cached_location');
    if (cached) {
      return JSON.parse(cached);
    }
  }
  return null;
}

// بررسی اعتبار کش موقعیت (پیش‌فرض 5 دقیقه)
export function isLocationCacheValid(maxAgeMs: number = 5 * 60 * 1000): boolean {
  const cached = getLocationFromCache();
  if (!cached) return false;
  return Date.now() - cached.cachedAt < maxAgeMs;
}