export interface Specimen {
  id: string;
  name: string;
  binomial: string;
  hash: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  sequence: string;
  discoveryDate: string;
}

export const SPECIMENS: Specimen[] = [
  {
    id: 'MYCO-001X',
    name: "Golden Teacher",
    binomial: "Psilocybe cubensis",
    hash: "6f8e23b1c4a9...",
    rarity: 'UNCOMMON',
    sequence: "ATCGGCTAAGCTTAGC...",
    discoveryDate: "2024-11-20"
  },
  {
    id: 'MYCO-042Z',
    name: "Lion's Mane",
    binomial: "Hericium erinaceus",
    hash: "a2b3c4d5e6f7...",
    rarity: 'RARE',
    sequence: "GCTAGCTAGCTGATCG...",
    discoveryDate: "2025-01-15"
  },
  {
    id: 'MYCO-088Y',
    name: "Fly Agaric",
    binomial: "Amanita muscaria",
    hash: "9876543210ab...",
    rarity: 'LEGENDARY',
    sequence: "TTAACCGGTTCCAAGG...",
    discoveryDate: "2025-03-02"
  },
  {
    id: 'MYCO-101A',
    name: "Reishi",
    binomial: "Ganoderma lucidum",
    hash: "f1e2d3c4b5a6...",
    rarity: 'RARE',
    sequence: "CCGGAAAATTCCCCGG...",
    discoveryDate: "2025-04-10"
  }
];
