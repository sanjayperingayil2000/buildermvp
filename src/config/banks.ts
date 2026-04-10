export interface BankDetails {
  id: string;
  name: string;
  logo: string;
  desc: string;
  bins: string[];
  shortLabel: string;
}

export const BANKS: BankDetails[] = [
  {
    id: 'bbva',
    name: 'BBVA Bancomer',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/98/BBVA_logo_2025.svg',
    desc: 'Welcome to BBVA secure portal.',
    bins: ['415231', '455511', '491566', '557910'],
    shortLabel: 'BBVA',
  },
  {
    id: 'santander',
    name: 'Santander Mexico',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg',
    desc: 'Welcome to Santander secure portal.',
    bins: ['491573', '549140', '553011'],
    shortLabel: 'SAN',
  },
  {
    id: 'banorte',
    name: 'Banorte',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Logo_de_Banorte.svg',
    desc: 'Your trusted Mexican bank portal.',
    bins: ['402766', '416916', '476684', '525678'],
    shortLabel: 'BNT',
  },
  {
    id: 'citibanamex',
    name: 'Citibanamex',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Citibanamex_logo.svg',
    desc: 'Global access, local trust portal.',
    bins: ['416393', '446131', '520416', '541203'],
    shortLabel: 'CITI',
  },
  {
    id: 'hsbc',
    name: 'HSBC',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg',
    desc: "The world's local bank secure portal.",
    bins: ['421316', '441221', '524021'],
    shortLabel: 'HSBC',
  },
];

export const BANK_DETAILS_DB: Record<string, { name: string; logo: string; desc: string }> =
  BANKS.reduce<Record<string, { name: string; logo: string; desc: string }>>((acc, bank) => {
    acc[bank.id] = { name: bank.name, logo: bank.logo, desc: bank.desc };
    return acc;
  }, {});

export const BIN_TO_BANK_ID: Record<string, string> = BANKS.reduce<Record<string, string>>(
  (acc, bank) => {
    bank.bins.forEach((bin) => {
      acc[bin] = bank.id;
    });
    return acc;
  },
  {}
);

export function resolveBankIdFromBin(bin: string): string | null {
  return BIN_TO_BANK_ID[bin] ?? null;
}