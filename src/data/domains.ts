export interface Domain {
  name: string
  url: string
  category: string
  status: 'online' | 'offline' | 'checking'
  lastChecked?: Date
}

export interface DomainCategory {
  name: string
  icon: string
  domains: Domain[]
}

export const domainCategories: DomainCategory[] = [
  {
    name: 'Ambulance',
    icon: '🚑',
    domains: [
      { name: 'ambulancesemarang.com', url: 'https://ambulancesemarang.com', category: 'Ambulance', status: 'checking' },
      { name: 'ambulancegratissemarang.com', url: 'https://ambulancegratissemarang.com', category: 'Ambulance', status: 'checking' },
    ],
  },
  {
    name: 'Rental Motor',
    icon: '🏍️',
    domains: [
      { name: 'rentalmotorsemarang.com', url: 'https://rentalmotorsemarang.com', category: 'Rental Motor', status: 'checking' },
      { name: 'rentalmotorsemarang.web.id', url: 'https://rentalmotorsemarang.web.id', category: 'Rental Motor', status: 'checking' },
      { name: 'rentalmotor99.com', url: 'https://rentalmotor99.com', category: 'Rental Motor', status: 'checking' },
      { name: 'rentalmotormalioboro.com', url: 'https://rentalmotormalioboro.com', category: 'Rental Motor', status: 'checking' },
    ],
  },
  {
    name: 'Affiliate',
    icon: '🔗',
    domains: [
      { name: 'staffpendidikan.com', url: 'https://staffpendidikan.com', category: 'Affiliate', status: 'checking' },
      { name: 'daftarunissula.com', url: 'https://daftarunissula.com', category: 'Affiliate', status: 'checking' },
      { name: 'daftarunikom.com', url: 'https://daftarunikom.com', category: 'Affiliate', status: 'checking' },
    ],
  },
  {
    name: 'Badal Umroh',
    icon: '🕋',
    domains: [
      { name: 'badalumroh.com', url: 'https://badalumroh.com', category: 'Badal Umroh', status: 'checking' },
      { name: 'lp.badalumroh.com', url: 'https://lp.badalumroh.com', category: 'Badal Umroh', status: 'checking' },
    ],
  },
  {
    name: 'Biro Hukum',
    icon: '⚖️',
    domains: [
      { name: 'birohukum.com', url: 'https://birohukum.com', category: 'Biro Hukum', status: 'checking' },
    ],
  },
  {
    name: 'Pendidikan',
    icon: '📚',
    domains: [
      { name: 'alfatihahschool.com', url: 'https://alfatihahschool.com', category: 'Pendidikan', status: 'checking' },
      { name: 'daycaresemarang.com', url: 'https://daycaresemarang.com', category: 'Pendidikan', status: 'checking' },
      { name: 'pkbm.alfatihahhomeschooling.com', url: 'https://pkbm.alfatihahhomeschooling.com', category: 'Pendidikan', status: 'checking' },
      { name: 'rumahtahfidzalfatihah.com', url: 'https://rumahtahfidzalfatihah.com', category: 'Pendidikan', status: 'checking' },
      { name: 'hotelkarantinaalquran.com', url: 'https://hotelkarantinaalquran.com', category: 'Pendidikan', status: 'checking' },
      { name: 'pesantrenkarantina.com', url: 'https://pesantrenkarantina.com', category: 'Pendidikan', status: 'checking' },
      { name: 'pesantrenalfatihah.com', url: 'https://pesantrenalfatihah.com', category: 'Pendidikan', status: 'checking' },
      { name: 'rumahquranalfatihah.com', url: 'https://rumahquranalfatihah.com', category: 'Pendidikan', status: 'checking' },
    ],
  },
  {
    name: 'Event',
    icon: '📅',
    domains: [
      { name: 'kajiansubuh.com', url: 'https://kajiansubuh.com', category: 'Event', status: 'checking' },
      { name: 'alfatihah.id/tamantadarus', url: 'https://alfatihah.id/tamantadarus', category: 'Event', status: 'checking' },
      { name: 'alfatihah.id/kelas-tahajud', url: 'https://alfatihah.id/kelas-tahajud', category: 'Event', status: 'checking' },
      { name: 'alfatihah.id/challenge-hijrah', url: 'https://alfatihah.id/challenge-hijrah', category: 'Event', status: 'checking' },
    ],
  },
  {
    name: 'Alhidayah',
    icon: '🕌',
    domains: [
      { name: 'yayasanalhidayah.com', url: 'https://yayasanalhidayah.com', category: 'Alhidayah', status: 'checking' },
      { name: 'alhidayahschool.sch.id', url: 'https://alhidayahschool.sch.id', category: 'Alhidayah', status: 'checking' },
      { name: 'spmb.alhidayahschool.sch.id', url: 'https://spmb.alhidayahschool.sch.id', category: 'Alhidayah', status: 'checking' },
    ],
  },
]

export const allDomains: Domain[] = domainCategories.flatMap((c) => c.domains)

export const WORDPRESS_SETUP_STEPS = [
  'Hosting & Domain terhubung',
  'SSL Certificate aktif (HTTPS)',
  'WordPress ter-install',
  'Tema WordPress dipilih & di-install',
  'Tema anak (child theme) dibuat',
  'Plugin dasar ter-install (SEO, Security, Backup)',
  'Permalink URL disetel (Post name)',
  'Logo & Favicon di-upload',
  'Halaman utama (Homepage) dibuat',
  'Halaman About / Tentang Kami dibuat',
  'Halaman Contact / Kontak dibuat',
  'Menu Navigasi dikonfigurasi',
  'Widget sidebar/footer diatur',
  'Google Analytics / Search Console terhubung',
  'Plugin SEO dikonfigurasi (meta title, description)',
  'Gambar & media dioptimasi (compress)',
  'Form kontak aktif (Contact Form 7 / WPForms)',
  'Caching plugin dikonfigurasi',
  'Keamanan (login limit, 2FA, hide login)',
  'Backup otomatis terjadwal',
  'Konten dummy dihapus / placeholder diganti',
  'Responsif di-test (mobile, tablet, desktop)',
  'Performance score di-check (PageSpeed Insights)',
] as const
