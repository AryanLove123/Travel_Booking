import { CatalogData, Destination, Hotel, PropertyType, Room } from '../../models/domain.model';

const photo = (seed: string, w = 900, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const AMENITIES = {
  base: ['Wifi', 'Air conditioning', 'TV'],
  kitchen: ['Kitchen'],
  extras: ['Free breakfast', 'Pool access', 'Heating', 'Washer', 'Bicycle rental', 'First aid kit', 'Free parking'],
};

interface DestinationSeed {
  id: string;
  name: string;
  country: string;
  tagline: string;
  description: string;
  published: boolean;
  hotels: HotelSeed[];
}
interface HotelSeed {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  description: string;
  rating: number;
  reviews: number;
  published: boolean;
  rooms: RoomSeed[];
}
interface RoomSeed {
  id: string;
  name: string;
  price: number;
  guests: number;
  beds: number;
  baths: number;
  units: number;
  amenities: string[];
  freeCancellation: boolean;
  published?: boolean;
}

const SEEDS: DestinationSeed[] = [
  {
    id: 'dest-tokyo',
    name: 'Tokyo',
    country: 'Japan',
    tagline: 'Neon nights and quiet shrines',
    description:
      'Japan’s capital blends ultra-modern districts with historic temples, world-class food and spotless public transport.',
    published: true,
    hotels: [
      {
        id: 'hotel-ueno-grand',
        name: 'Ueno Grand Hotel',
        type: 'hotel',
        address: '1-12 Ueno, Taito City, Tokyo',
        description:
          'Classic hotel steps from Ueno Park and the museum district, with fast links to the airport.',
        rating: 4.84,
        reviews: 324,
        published: true,
        rooms: [
          {
            id: 'room-ueno-family',
            name: 'Superior Family Room',
            price: 87,
            guests: 6,
            beds: 4,
            baths: 1,
            units: 3,
            amenities: [...AMENITIES.base, 'Kitchen', 'First aid kit', 'Bicycle rental'],
            freeCancellation: true,
          },
          {
            id: 'room-ueno-twin',
            name: 'Standard Twin',
            price: 64,
            guests: 2,
            beds: 2,
            baths: 1,
            units: 5,
            amenities: [...AMENITIES.base, 'Heating'],
            freeCancellation: true,
          },
        ],
      },
      {
        id: 'hotel-akihabara-stay',
        name: 'Akihabara Rainbow Apartments',
        type: 'apartment',
        address: '3-5 Sotokanda, Chiyoda City, Tokyo',
        description: 'Self-catering apartments in the electronics and anime district.',
        rating: 4.77,
        reviews: 636,
        published: true,
        rooms: [
          {
            id: 'room-akiba-1br',
            name: 'Rainbow Plantation Suite',
            price: 63,
            guests: 3,
            beds: 1,
            baths: 1,
            units: 4,
            amenities: [...AMENITIES.base, 'Kitchen', 'Washer'],
            freeCancellation: false,
          },
          {
            id: 'room-akiba-jr',
            name: 'Junior Suite',
            price: 36,
            guests: 3,
            beds: 2,
            baths: 1,
            units: 2,
            amenities: [...AMENITIES.base],
            freeCancellation: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dest-maldives',
    name: 'Maldives',
    country: 'Maldives',
    tagline: 'Overwater villas and turquoise lagoons',
    description: 'Private-island resorts, house reefs and some of the clearest water on earth.',
    published: true,
    hotels: [
      {
        id: 'hotel-coral-atoll',
        name: 'Coral Atoll Resort',
        type: 'hotel',
        address: 'North Malé Atoll, Maldives',
        description: 'Adults-and-families resort with a house reef and overwater villas.',
        rating: 4.92,
        reviews: 812,
        published: true,
        rooms: [
          {
            id: 'room-coral-villa',
            name: 'Overwater Villa',
            price: 420,
            guests: 3,
            beds: 1,
            baths: 1,
            units: 4,
            amenities: [...AMENITIES.base, 'Free breakfast', 'Pool access', 'Bicycle rental'],
            freeCancellation: true,
          },
          {
            id: 'room-coral-beach',
            name: 'Beach Bungalow',
            price: 260,
            guests: 4,
            beds: 2,
            baths: 1,
            units: 6,
            amenities: [...AMENITIES.base, 'Free breakfast'],
            freeCancellation: true,
          },
        ],
      },
      {
        id: 'hotel-lagoon-guesthouse',
        name: 'Lagoon Guesthouse',
        type: 'guesthouse',
        address: 'Maafushi, Kaafu Atoll, Maldives',
        description: 'Friendly local-island guesthouse with snorkelling trips on request.',
        rating: 4.51,
        reviews: 203,
        published: true,
        rooms: [
          {
            id: 'room-lagoon-dbl',
            name: 'Garden Double',
            price: 95,
            guests: 2,
            beds: 1,
            baths: 1,
            units: 5,
            amenities: [...AMENITIES.base, 'Free breakfast'],
            freeCancellation: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dest-bhutan',
    name: 'Bhutan',
    country: 'Bhutan',
    tagline: 'Monasteries in the Himalayas',
    description:
      'The last Himalayan kingdom: dzongs, prayer flags, mountain trails and a focus on happiness over GDP.',
    published: true,
    hotels: [
      {
        id: 'hotel-paro-valley',
        name: 'Paro Valley Lodge',
        type: 'guesthouse',
        address: 'Paro Valley, Bhutan',
        description: 'Traditional lodge with hot-stone baths and views of Tiger’s Nest trail.',
        rating: 4.8,
        reviews: 167,
        published: true,
        rooms: [
          {
            id: 'room-paro-deluxe',
            name: 'Deluxe Mountain Room',
            price: 140,
            guests: 3,
            beds: 2,
            baths: 1,
            units: 4,
            amenities: [...AMENITIES.base, 'Heating', 'Free breakfast'],
            freeCancellation: true,
          },
          {
            id: 'room-paro-family',
            name: 'Family Chalet',
            price: 210,
            guests: 5,
            beds: 3,
            baths: 2,
            units: 2,
            amenities: [...AMENITIES.base, 'Heating', 'Kitchen'],
            freeCancellation: false,
          },
        ],
      },
    ],
  },
  {
    id: 'dest-amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    tagline: 'Canals, bikes and museums',
    description: 'A compact canal city with world-famous museums, cafés and cycling everywhere.',
    published: true,
    hotels: [
      {
        id: 'hotel-canal-house',
        name: 'Canal House Hotel',
        type: 'hotel',
        address: 'Herengracht 120, Amsterdam',
        description: 'Boutique hotel in a restored 17th-century canal house.',
        rating: 4.7,
        reviews: 540,
        published: true,
        rooms: [
          {
            id: 'room-canal-dbl',
            name: 'Canal View Double',
            price: 165,
            guests: 2,
            beds: 1,
            baths: 1,
            units: 5,
            amenities: [...AMENITIES.base, 'Free breakfast', 'Bicycle rental'],
            freeCancellation: true,
          },
          {
            id: 'room-canal-fam',
            name: 'Garden Family Suite',
            price: 240,
            guests: 4,
            beds: 2,
            baths: 1,
            units: 2,
            amenities: [...AMENITIES.base, 'Kitchen', 'Heating'],
            freeCancellation: true,
          },
        ],
      },
      {
        id: 'hotel-jordaan-loft',
        name: 'Jordaan Loft',
        type: 'house',
        address: 'Egelantiersgracht 33, Amsterdam',
        description: 'Entire loft house in the Jordaan neighbourhood, ideal for small groups.',
        rating: 4.86,
        reviews: 42,
        published: true,
        rooms: [
          {
            id: 'room-jordaan-loft',
            name: 'Solitude Pointe Loft',
            price: 97,
            guests: 2,
            beds: 2,
            baths: 1,
            units: 1,
            amenities: [...AMENITIES.base, 'Kitchen', 'Washer'],
            freeCancellation: false,
          },
        ],
      },
    ],
  },
  {
    id: 'dest-newyork',
    name: 'New York',
    country: 'United States',
    tagline: 'The city that never sleeps',
    description:
      'Broadway, Central Park, galleries and every cuisine imaginable within a subway ride.',
    published: true,
    hotels: [
      {
        id: 'hotel-midtown-plaza',
        name: 'Midtown Plaza Hotel',
        type: 'hotel',
        address: '350 W 40th St, New York',
        description: 'Modern hotel two blocks from Times Square.',
        rating: 4.4,
        reviews: 1290,
        published: true,
        rooms: [
          {
            id: 'room-midtown-queen',
            name: 'Queen Room',
            price: 189,
            guests: 2,
            beds: 1,
            baths: 1,
            units: 8,
            amenities: [...AMENITIES.base, 'Heating'],
            freeCancellation: true,
          },
          {
            id: 'room-midtown-suite',
            name: 'Skyline Suite',
            price: 349,
            guests: 4,
            beds: 2,
            baths: 2,
            units: 2,
            amenities: [...AMENITIES.base, 'Kitchen', 'Free breakfast'],
            freeCancellation: true,
          },
        ],
      },
      {
        id: 'hotel-brooklyn-brownstone',
        name: 'Brooklyn Brownstone Rooms',
        type: 'guesthouse',
        address: '45 Hancock St, Brooklyn',
        description: 'Quiet rooms in a restored brownstone, 20 minutes from Manhattan.',
        rating: 4.65,
        reviews: 98,
        published: true,
        rooms: [
          {
            id: 'room-brooklyn-garden',
            name: 'Garden Room',
            price: 129,
            guests: 2,
            beds: 1,
            baths: 1,
            units: 3,
            amenities: [...AMENITIES.base, 'Free breakfast'],
            freeCancellation: true,
          },
        ],
      },
    ],
  },
  {
    // Deliberately unpublished so the admin visibility toggle is demonstrable.
    id: 'dest-reykjavik',
    name: 'Reykjavik',
    country: 'Iceland',
    tagline: 'Northern lights and geothermal pools',
    description: 'Coming soon: lava fields, hot springs and aurora season.',
    published: false,
    hotels: [
      {
        id: 'hotel-harbour-inn',
        name: 'Harbour Inn',
        type: 'hotel',
        address: 'Geirsgata 9, Reykjavik',
        description: 'Waterfront hotel with a geothermal hot tub.',
        rating: 4.6,
        reviews: 75,
        published: true,
        rooms: [
          {
            id: 'room-harbour-dbl',
            name: 'Harbour Double',
            price: 175,
            guests: 2,
            beds: 1,
            baths: 1,
            units: 4,
            amenities: [...AMENITIES.base, 'Heating'],
            freeCancellation: true,
          },
        ],
      },
    ],
  },
];

export function buildSeedCatalog(): CatalogData {
  const destinations: Destination[] = [];
  const hotels: Hotel[] = [];
  const rooms: Room[] = [];

  for (const d of SEEDS) {
    destinations.push({
      id: d.id,
      name: d.name,
      country: d.country,
      tagline: d.tagline,
      description: d.description,
      imageUrl: photo(d.id, 800, 900),
      published: d.published,
    });

    for(const h of d.hotels){
        hotels.push({
        id: h.id,
        destinationId: d.id,
        name: h.name,
        propertyType: h.type,
        address: h.address,
        description: h.description,
        rating: h.rating,
        reviewCount: h.reviews,
        imageUrls: [photo(`${h.id}-1`), photo(`${h.id}-2`)],
        published: h.published,
      });

      for (const r of h.rooms) {
        rooms.push({
          id: r.id,
          hotelId: h.id,
          name: r.name,
          description: `${r.name} at ${h.name}. Sleeps ${r.guests}, ${r.beds} bed${r.beds > 1 ? 's' : ''}, ${r.baths} bathroom${r.baths > 1 ? 's' : ''}. A comfortable base for exploring ${d.name}.`,
          pricePerNight: r.price,
          maxGuests: r.guests,
          beds: r.beds,
          bathrooms: r.baths,
          totalUnits: r.units,
          amenities: r.amenities,
          imageUrls: [photo(`${r.id}-1`), photo(`${r.id}-2`), photo(`${r.id}-3`), photo(`${r.id}-4`)],
          freeCancellation: r.freeCancellation,
          published: r.published ?? true,
        });
      }
    }
  }
  return {destinations, hotels, rooms};
}
