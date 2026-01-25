// lib/election-data.ts

export interface Ward {
  wardNo: number;
  wardName: string;
  constituency: string | null;
  reservation: string | null;
}

export interface ULB {
  ulb: string;
  wards: Ward[];
}

export interface District {
  district: string;
  ulbs: ULB[];
}

export interface ElectionData {
  totalWards: number;
  election: string;
  districts: District[];
}

export const electionData: ElectionData = {
  totalWards: 69,
  election: "Municipality Election 2026",
  districts: [
    {
      district: "GYALSHING",
      ulbs: [
        {
          ulb: "Gyalshing Nagar Panchayat",
          wards: [
            {
              wardNo: 1,
              wardName: "Kyangsa",
              constituency: "02-Yanthang",
              reservation: null,
            },
            {
              wardNo: 2,
              wardName: "Byadong",
              constituency: "04-Gyalshing Bermiok",
              reservation: null,
            },
            {
              wardNo: 3,
              wardName: "Nayabazar",
              constituency: "04-Gyalshing Bermiok",
              reservation: null,
            },
            {
              wardNo: 4,
              wardName: "Central Gyalshing",
              constituency: "04-Gyalshing Bermiok",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "New Gyalshing",
              constituency: "04-Gyalshing Bermiok",
              reservation: null,
            },
          ],
        },
      ],
    },
    {
      district: "SORENG",
      ulbs: [
        {
          ulb: "Soreng Nagar Panchayat",
          wards: [
            {
              wardNo: 1,
              wardName: "Singling",
              constituency: "07-Soreng Chakung",
              reservation: null,
            },
            {
              wardNo: 2,
              wardName: "Dara Bazar",
              constituency: "07-Soreng Chakung",
              reservation: null,
            },
            {
              wardNo: 3,
              wardName: "Soreng Bazar",
              constituency: "07-Soreng Chakung",
              reservation: null,
            },
            {
              wardNo: 4,
              wardName: "Pragiti Chowk",
              constituency: "07-Soreng Chakung",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "Daragoan",
              constituency: "07-Soreng Chakung",
              reservation: null,
            },
          ],
        },
      ],
    },
    {
      district: "NAMCHI",
      ulbs: [
        {
          ulb: "Jorethang Municipal Council",
          wards: [
            {
              wardNo: 1,
              wardName: "Shantinagar",
              constituency: "08-Zoom Salghari",
              reservation: "UR",
            },
            {
              wardNo: 2,
              wardName: "Trikaleshwar",
              constituency: "08-Zoom Salghari",
              reservation: "OBC (C) W",
            },
            {
              wardNo: 3,
              wardName: "Daragoan",
              constituency: "08-Zoom Salghari",
              reservation: "OBC (S)",
            },
            {
              wardNo: 4,
              wardName: "Majigoan",
              constituency: "08-Zoom Salghari",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "Nayabazar",
              constituency: "08-Zoom Salghari",
              reservation: "SC (W)",
            },
          ],
        },
        {
          ulb: "Namchi Municipal Council",
          wards: [
            {
              wardNo: 1,
              wardName: "Gangyap",
              constituency: "11-Namchi Singhithang",
              reservation: "UR (W)",
            },
            {
              wardNo: 2,
              wardName: "Dambudara",
              constituency: "11-Namchi Singhithang",
              reservation: "OBC (S)",
            },
            {
              wardNo: 3,
              wardName: "Upper Ghurpisey",
              constituency: "11-Namchi Singhithang",
              reservation: "ST",
            },
            {
              wardNo: 4,
              wardName: "Lower Ghurpisey",
              constituency: "11-Namchi Singhithang",
              reservation: "SC (W)",
            },
            {
              wardNo: 5,
              wardName: "Upper Boomtar",
              constituency: "11-Namchi Singhithang",
              reservation: "ST (W)",
            },
            {
              wardNo: 6,
              wardName: "Upper Singithang",
              constituency: "11-Namchi Singhithang",
              reservation: "OBC (C)",
            },
            {
              wardNo: 7,
              wardName: "Purano Namchi",
              constituency: "11-Namchi Singhithang",
              reservation: "OBC (C)",
            },
          ],
        },
      ],
    },
    {
      district: "GANGTOK",
      ulbs: [
        {
          ulb: "Gangtok Municipal Corporation",
          wards: [
            {
              wardNo: 1,
              wardName: "Bojoghari 2nd Mile",
              constituency: "29-Kabi Lungchuk",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Upper Burtuk",
              constituency: "28-Upper Burtuk",
              reservation: "UR",
            },
            {
              wardNo: 3,
              wardName: "Lower Burtuk",
              constituency: "28-Upper Burtuk",
              reservation: "OBC (C) W",
            },
            {
              wardNo: 4,
              wardName: "Lower Sichey-I",
              constituency: "28-Upper Burtuk",
              reservation: null,
            },
            {
              wardNo: 5,
              wardName: "Lower Sichey-II (Lingding)",
              constituency: null,
              reservation: null,
            },
          ],
        },
      ],
    },
    {
      district: "MANGAN",
      ulbs: [
        {
          ulb: "Mangan Nagar Panchayat",
          wards: [
            {
              wardNo: 1,
              wardName: "Upper Mangan Bazar",
              constituency: "31-Lachen Mangan",
              reservation: "ST",
            },
            {
              wardNo: 2,
              wardName: "Pentok",
              constituency: "31-Lachen Mangan",
              reservation: "ST (W)",
            },
            {
              wardNo: 3,
              wardName: "Power Colony",
              constituency: "31-Lachen Mangan",
              reservation: "UR (W)",
            },
            {
              wardNo: 4,
              wardName: "Rinzing Namgyal Marg",
              constituency: "31-Lachen Mangan",
              reservation: "ST",
            },
            {
              wardNo: 5,
              wardName: "Lower Mangan Bazar",
              constituency: "31-Lachen Mangan",
              reservation: "UR (W)",
            },
          ],
        },
      ],
    },
  ],
};

// Political parties of Sikkim
export interface PoliticalParty {
  id: string;
  name: string;
  shortName: string;
  symbol: string;
  symbolImage: string;
}

export const politicalParties: PoliticalParty[] = [
  {
    id: "skm",
    name: "Sikkim Krantikari Morcha",
    shortName: "SKM",
    symbol: "Lamp",
    symbolImage: "/election-symbols/skm.png",
  },
  {
    id: "sdf",
    name: "Sikkim Democratic Front",
    shortName: "SDF",
    symbol: "Umbrella ",
    symbolImage: "/election-symbols/sdf.png",
  },
  {
    id: "bjp",
    name: "Bharatiya Janata Party",
    shortName: "BJP",
    symbol: "Lotus",
    symbolImage: "/election-symbols/bjp.png",
  },
  {
    id: "inc",
    name: "Indian National Congress",
    shortName: "INC",
    symbol: "Hand",
    symbolImage: "/election-symbols/inc.png",
  },
  {
    id: "independent",
    name: "Independent",
    shortName: "IND",
    symbol: "",
    symbolImage: "",
  },
];

// Independent candidate symbols (excluding SKM and SDF symbols)
export interface IndependentSymbol {
  id: string;
  name: string;
  image: string;
}

export const independentSymbols: IndependentSymbol[] = [
  { id: "almirah", name: "Almirah", image: "/election-symbols/almirah.png" },
  {
    id: "autorickshaw",
    name: "Auto Rickshaw",
    image: "/election-symbols/autorickshaw.png",
  },
  { id: "balloon", name: "Balloon", image: "/election-symbols/balloon.png" },
  { id: "bangles", name: "Bangles", image: "/election-symbols/bangles.png" },
  {
    id: "batterytorch",
    name: "Battery Torch",
    image: "/election-symbols/batterytorch.png",
  },
  {
    id: "blackboard",
    name: "Blackboard",
    image: "/election-symbols/blackboard.png",
  },
];

// Helper function to get random symbols for independent candidates
export function getRandomSymbols(count: number = 5): IndependentSymbol[] {
  const shuffled = [...independentSymbols].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get districts list
export function getDistricts(): string[] {
  return electionData.districts.map((d) => d.district);
}

// Get ULBs for a district
export function getULBsForDistrict(district: string): string[] {
  const found = electionData.districts.find((d) => d.district === district);
  return found ? found.ulbs.map((u) => u.ulb) : [];
}

// Get wards for a ULB
export function getWardsForULB(district: string, ulb: string): Ward[] {
  const foundDistrict = electionData.districts.find(
    (d) => d.district === district,
  );
  if (!foundDistrict) return [];
  const foundULB = foundDistrict.ulbs.find((u) => u.ulb === ulb);
  return foundULB ? foundULB.wards : [];
}

// Get party by ID
export function getPartyById(id: string): PoliticalParty | undefined {
  return politicalParties.find((p) => p.id === id);
}
