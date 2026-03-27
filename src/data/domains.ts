export interface Domain {
  name: string
  url: string
  category: string
  owner: string
  status: 'online' | 'offline' | 'checking'
  lastChecked?: Date
}

export interface DomainCategory {
  name: string
  icon: string
  domains: Domain[]
}

function d(name: string, url: string, category: string, owner: string): Domain {
  return { name, url, category, owner, status: 'checking' }
}

const alulCategories: DomainCategory[] = [
  {
    name: 'Ambulance',
    icon: '🚑',
    domains: [
      d('ambulancesemarang.com', 'https://ambulancesemarang.com', 'Ambulance', 'alul'),
      d('ambulancegratissemarang.com', 'https://ambulancegratissemarang.com', 'Ambulance', 'alul'),
    ],
  },
  {
    name: 'Rental Motor',
    icon: '🏍️',
    domains: [
      d('rentalmotorsemarang.com', 'https://rentalmotorsemarang.com', 'Rental Motor', 'alul'),
      d('rentalmotorsemarang.web.id', 'https://rentalmotorsemarang.web.id', 'Rental Motor', 'alul'),
      d('rentalmotor99.com', 'https://rentalmotor99.com', 'Rental Motor', 'alul'),
      d('rentalmotormalioboro.com', 'https://rentalmotormalioboro.com', 'Rental Motor', 'alul'),
    ],
  },
  {
    name: 'Affiliate',
    icon: '🔗',
    domains: [
      d('staffpendidikan.com', 'https://staffpendidikan.com', 'Affiliate', 'alul'),
      d('daftarunissula.com', 'https://daftarunissula.com', 'Affiliate', 'alul'),
      d('daftarunikom.com', 'https://daftarunikom.com', 'Affiliate', 'alul'),
    ],
  },
  {
    name: 'Badal Umroh',
    icon: '🕋',
    domains: [
      d('badalumroh.com', 'https://badalumroh.com', 'Badal Umroh', 'alul'),
      d('lp.badalumroh.com', 'https://lp.badalumroh.com', 'Badal Umroh', 'alul'),
    ],
  },
  {
    name: 'Biro Hukum',
    icon: '⚖️',
    domains: [
      d('birohukum.com', 'https://birohukum.com', 'Biro Hukum', 'alul'),
    ],
  },
  {
    name: 'Pendidikan',
    icon: '📚',
    domains: [
      d('alfatihahschool.com', 'https://alfatihahschool.com', 'Pendidikan', 'alul'),
      d('daycaresemarang.com', 'https://daycaresemarang.com', 'Pendidikan', 'alul'),
      d('pkbm.alfatihahhomeschooling.com', 'https://pkbm.alfatihahhomeschooling.com', 'Pendidikan', 'alul'),
      d('rumahtahfidzalfatihah.com', 'https://rumahtahfidzalfatihah.com', 'Pendidikan', 'alul'),
      d('hotelkarantinaalquran.com', 'https://hotelkarantinaalquran.com', 'Pendidikan', 'alul'),
      d('pesantrenkarantina.com', 'https://pesantrenkarantina.com', 'Pendidikan', 'alul'),
      d('pesantrenalfatihah.com', 'https://pesantrenalfatihah.com', 'Pendidikan', 'alul'),
      d('rumahquranalfatihah.com', 'https://rumahquranalfatihah.com', 'Pendidikan', 'alul'),
    ],
  },
  {
    name: 'Event',
    icon: '📅',
    domains: [
      d('kajiansubuh.com', 'https://kajiansubuh.com', 'Event', 'alul'),
      d('alfatihah.id/tamantadarus', 'https://alfatihah.id/tamantadarus', 'Event', 'alul'),
      d('alfatihah.id/kelas-tahajud', 'https://alfatihah.id/kelas-tahajud', 'Event', 'alul'),
      d('alfatihah.id/challenge-hijrah', 'https://alfatihah.id/challenge-hijrah', 'Event', 'alul'),
    ],
  },
  {
    name: 'Alhidayah',
    icon: '🕌',
    domains: [
      d('yayasanalhidayah.com', 'https://yayasanalhidayah.com', 'Alhidayah', 'alul'),
      d('alhidayahschool.sch.id', 'https://alhidayahschool.sch.id', 'Alhidayah', 'alul'),
      d('spmb.alhidayahschool.sch.id', 'https://spmb.alhidayahschool.sch.id', 'Alhidayah', 'alul'),
    ],
  },
]

const dymasCategories: DomainCategory[] = [
  {
    name: 'Al Quran',
    icon: '📖',
    domains: [
      d('sahabatquran.id', 'https://sahabatquran.id/', 'Al Quran', 'dymas'),
      d('tebarquran.com', 'https://tebarquran.com/', 'Al Quran', 'dymas'),
      d('qarim.id', 'https://qarim.id/', 'Al Quran', 'dymas'),
      d('quranpelosok.com', 'https://quranpelosok.com/', 'Al Quran', 'dymas'),
      d('alfatihah.id', 'https://alfatihah.id/', 'Al Quran', 'dymas'),
      d('rumahtahfidzalfatihah.com', 'https://rumahtahfidzalfatihah.com/', 'Al Quran', 'dymas'),
      d('ekspedisiquran.com', 'https://ekspedisiquran.com/', 'Al Quran', 'dymas'),
      d('lp.ekspedisiquran.com', 'https://lp.ekspedisiquran.com/', 'Al Quran', 'dymas'),
      d('alquransantri.com', 'http://alquransantri.com/', 'Al Quran', 'dymas'),
    ],
  },
  {
    name: 'Sumur',
    icon: '💧',
    domains: [
      d('wakafsumur.com', 'https://wakafsumur.com/', 'Sumur', 'dymas'),
      d('wakafsumur.org', 'https://wakafsumur.org/', 'Sumur', 'dymas'),
      d('sumurorangtua.com', 'https://sumurorangtua.com/', 'Sumur', 'dymas'),
      d('wakafsumurindonesia.com', 'http://wakafsumurindonesia.com/', 'Sumur', 'dymas'),
    ],
  },
  {
    name: 'Makkah',
    icon: '🕋',
    domains: [
      d('tabunganwakaf.com', 'https://tabunganwakaf.com/', 'Makkah', 'dymas'),
      d('sedekahnasibaitullah.com', 'https://sedekahnasibaitullah.com/', 'Makkah', 'dymas'),
      d('sedekahiftar.com', 'https://sedekahiftar.com/', 'Makkah', 'dymas'),
      d('sajadahmakkah.com', 'https://sajadahmakkah.com/', 'Makkah', 'dymas'),
    ],
  },
  {
    name: 'Doa Yatim',
    icon: '🤲',
    domains: [
      d('doayatim.com', 'https://doayatim.com/', 'Doa Yatim', 'dymas'),
    ],
  },
  {
    name: 'KSS',
    icon: '🌅',
    domains: [
      d('komunitassedekahsubuh.com', 'https://komunitassedekahsubuh.com/', 'KSS', 'dymas'),
    ],
  },
]

const dillaCategories: DomainCategory[] = [
  {
    name: 'RANS',
    icon: '👶',
    domains: [
      d('rumahanaksurga.com', 'https://rumahanaksurga.com/', 'RANS', 'dilla'),
      d('pantibayisemarang.com', 'https://pantibayisemarang.com/', 'RANS', 'dilla'),
      d('pantibayi.id', 'https://pantibayi.id/', 'RANS', 'dilla'),
      d('pantibayi.com', 'https://pantibayi.com/', 'RANS', 'dilla'),
      d('pantibayi.org', 'https://pantibayi.org/', 'RANS', 'dilla'),
      d('penjagabayi.com', 'https://penjagabayi.com/', 'RANS', 'dilla'),
      d('rumahbayisemarang.com', 'https://rumahbayisemarang.com/', 'RANS', 'dilla'),
    ],
  },
  {
    name: 'RAMAH',
    icon: '🏠',
    domains: [
      d('rumahanakalfatihah.com', 'https://rumahanakalfatihah.com/', 'RAMAH', 'dilla'),
      d('donasi.rumahanakalfatihah.com', 'https://donasi.rumahanakalfatihah.com/', 'RAMAH', 'dilla'),
      d('pantibayijogja.com', 'https://pantibayijogja.com/', 'RAMAH', 'dilla'),
      d('pantijogja.com', 'https://pantijogja.com/', 'RAMAH', 'dilla'),
      d('rumahanak.org', 'http://rumahanak.org/', 'RAMAH', 'dilla'),
      d('anakalfatihah.com', 'http://anakalfatihah.com/', 'RAMAH', 'dilla'),
      d('sayapalfatihah.com', 'http://sayapalfatihah.com/', 'RAMAH', 'dilla'),
      d('harapanbayi.com', 'https://harapanbayi.com/', 'RAMAH', 'dilla'),
    ],
  },
]

const momentumCategories: DomainCategory[] = [
  {
    name: 'Momentum Qurban',
    icon: '🐄',
    domains: [
      d('alfatihahfarm.com', 'https://alfatihahfarm.com', 'Momentum Qurban', 'shared'),
      d('qurbanalfatihah.com', 'https://qurbanalfatihah.com', 'Momentum Qurban', 'shared'),
      d('qurbanindonesia.com', 'https://qurbanindonesia.com', 'Momentum Qurban', 'shared'),
      d('sahabatqurban.com', 'https://sahabatqurban.com', 'Momentum Qurban', 'shared'),
      d('beraniqurban.com', 'https://beraniqurban.com', 'Momentum Qurban', 'shared'),
      d('qurbanhemat.com', 'https://qurbanhemat.com', 'Momentum Qurban', 'shared'),
      d('qurbanpromo.com', 'https://qurbanpromo.com', 'Momentum Qurban', 'shared'),
      d('cintaqurban.com', 'https://cintaqurban.com', 'Momentum Qurban', 'shared'),
      d('qurbansantri.com', 'https://qurbansantri.com', 'Momentum Qurban', 'shared'),
      d('indonesiaberqurban.id', 'https://indonesiaberqurban.id', 'Momentum Qurban', 'shared'),
      d('jualqurban.com', 'https://jualqurban.com', 'Momentum Qurban', 'shared'),
    ],
  },
]

export const userDomains: Record<string, DomainCategory[]> = {
  alul: [...alulCategories, ...momentumCategories],
  dymas: [...dymasCategories, ...momentumCategories],
  dilla: [...dillaCategories, ...momentumCategories],
  staffwebdev: [...alulCategories, ...dymasCategories, ...dillaCategories, ...momentumCategories],
}

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
