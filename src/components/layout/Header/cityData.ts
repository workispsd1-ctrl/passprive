export interface City {
  name: string
  region: string
}

export interface CountryData {
  popularCities: string[]
  allCities: City[]
}

export const CITY_DATA: Record<string, CountryData> = {
  mu: {
    popularCities: [
      'Port Louis', 'Ebene', 'Grand Baie', 'Quatre Bornes',
      'Curepipe', 'Flic en Flac', 'Mahebourg', 'Beau Bassin',
    ],
    allCities: [
      { name: 'Albion', region: 'Black River' },
      { name: 'Bambous', region: 'Black River' },
      { name: 'Beau Bassin', region: 'Plaines Wilhems' },
      { name: 'Belle Mare', region: 'Flacq' },
      { name: 'Belle Vue Harel', region: 'Rivière du Rempart' },
      { name: 'Black River', region: 'Black River' },
      { name: 'Bois des Amourettes', region: 'Grand Port' },
      { name: 'Camp de Masque', region: 'Flacq' },
      { name: 'Centre de Flacq', region: 'Flacq' },
      { name: 'Chemin Grenier', region: 'Savanne' },
      { name: 'Curepipe', region: 'Plaines Wilhems' },
      { name: 'Ebene', region: 'Moka' },
      { name: 'Flic en Flac', region: 'Black River' },
      { name: 'Flacq', region: 'Flacq' },
      { name: 'Floreal', region: 'Plaines Wilhems' },
      { name: 'Goodlands', region: 'Rivière du Rempart' },
      { name: 'Grand Baie', region: 'Rivière du Rempart' },
      { name: 'Grand Bois', region: 'Grand Port' },
      { name: 'Grand Gaube', region: 'Rivière du Rempart' },
      { name: 'Grand Port', region: 'Grand Port' },
      { name: 'Gris Gris', region: 'Savanne' },
      { name: 'Lallmatie', region: 'Flacq' },
      { name: 'Mahebourg', region: 'Grand Port' },
      { name: 'Moka', region: 'Moka' },
      { name: 'Montagne Blanche', region: 'Grand Port' },
      { name: 'Pamplemousses', region: 'Pamplemousses' },
      { name: 'Petit Raffray', region: 'Rivière du Rempart' },
      { name: 'Phoenix', region: 'Plaines Wilhems' },
      { name: 'Plaine Magnien', region: 'Grand Port' },
      { name: 'Port Louis', region: 'Port Louis' },
      { name: 'Quatre Bornes', region: 'Plaines Wilhems' },
      { name: 'Rivière des Anguilles', region: 'Savanne' },
      { name: 'Rivière du Rempart', region: 'Rivière du Rempart' },
      { name: 'Rose Belle', region: 'Grand Port' },
      { name: 'Rose Hill', region: 'Plaines Wilhems' },
      { name: 'Roche Bois', region: 'Port Louis' },
      { name: 'Rodrigues', region: 'Rodrigues' },
      { name: 'Saint Pierre', region: 'Moka' },
      { name: 'Souillac', region: 'Savanne' },
      { name: 'Tamarin', region: 'Black River' },
      { name: 'Trou aux Biches', region: 'Pamplemousses' },
      { name: 'Trou d\'Eau Douce', region: 'Flacq' },
      { name: 'Triolet', region: 'Pamplemousses' },
      { name: 'Vacoas', region: 'Plaines Wilhems' },
      { name: 'Verdun', region: 'Moka' },
      { name: 'Wooton', region: 'Moka' },
    ],
  },
  ae: {
    popularCities: [
      'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman',
      'Ras Al Khaimah', 'Fujairah', 'Al Ain', 'Umm Al Quwain',
    ],
    allCities: [
      { name: 'Abu Dhabi', region: 'Abu Dhabi' },
      { name: 'Ajman', region: 'Ajman' },
      { name: 'Al Ain', region: 'Abu Dhabi' },
      { name: 'Al Fujairah', region: 'Fujairah' },
      { name: 'Al Quoz', region: 'Dubai' },
      { name: 'Business Bay', region: 'Dubai' },
      { name: 'Bur Dubai', region: 'Dubai' },
      { name: 'Deira', region: 'Dubai' },
      { name: 'Downtown Dubai', region: 'Dubai' },
      { name: 'Dubai', region: 'Dubai' },
      { name: 'Dubai Marina', region: 'Dubai' },
      { name: 'Dubai Silicon Oasis', region: 'Dubai' },
      { name: 'Fujairah', region: 'Fujairah' },
      { name: 'International City', region: 'Dubai' },
      { name: 'Jumeirah', region: 'Dubai' },
      { name: 'Khalifa City', region: 'Abu Dhabi' },
      { name: 'Mirdif', region: 'Dubai' },
      { name: 'Musaffah', region: 'Abu Dhabi' },
      { name: 'Palm Jumeirah', region: 'Dubai' },
      { name: 'Ras Al Khaimah', region: 'Ras Al Khaimah' },
      { name: 'Sharjah', region: 'Sharjah' },
      { name: 'Umm Al Quwain', region: 'Umm Al Quwain' },
    ],
  },
}

export const DEFAULT_COUNTRY = 'mu'
