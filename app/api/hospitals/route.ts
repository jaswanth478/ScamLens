import { NextResponse } from 'next/server';
import { Client } from '@googlemaps/google-maps-services-js';
import { HospitalSchema } from '@/lib/schemas';
import { z } from 'zod';

const mapsClient = new Client({});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Valid lat/lng required.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY as string;

    const response = await mapsClient.placesNearby({
      params: {
        location: { lat, lng },
        radius: 5000,
        type: 'hospital',
        key: apiKey,
      },
    });

    const hospitals = response.data.results.slice(0, 5).map((place) => {
      const distanceKm = calculateDistance(
        lat, lng,
        place.geometry?.location.lat ?? 0,
        place.geometry?.location.lng ?? 0
      );

      return {
        name: place.name ?? 'Unknown',
        address: place.vicinity ?? 'Address unavailable',
        distance: `${distanceKm.toFixed(1)} km`,
        openNow: place.opening_hours?.open_now,
        rating: place.rating,
        placeId: place.place_id ?? '',
      };
    });

    const validated = z.array(HospitalSchema).parse(hospitals);
    return NextResponse.json(validated);
  } catch (error: unknown) {
    console.error('Hospitals API error:', error);
    return NextResponse.json({ error: 'Failed to find nearby hospitals.' }, { status: 500 });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
