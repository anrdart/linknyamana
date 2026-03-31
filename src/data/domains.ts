export interface Domain {
  name: string
  url: string
  category: string
  owner: string
  status: 'online' | 'offline' | 'checking'
  lastChecked?: Date
  lastDeepChecked?: Date
  registrationDate?: string
  expiryDate?: string
  whatsappNotify?: boolean
  isArchived?: boolean
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
      d('ambulancemedis.com', 'http://ambulancemedis.com/', 'Ambulance', 'alul'),
      d('ambulancehebat.com', 'http://ambulancehebat.com/', 'Ambulance', 'alul'),
      d('ambulancedemak.com', 'http://ambulancedemak.com/', 'Ambulance', 'alul'),
      d('ambulancekendal.com', 'https://ambulancekendal.com', 'Ambulance', 'alul'),
      d('ambulanceungaran.com', 'https://ambulanceungaran.com', 'Ambulance', 'alul'),
      d('ambulancejateng.com', 'http://ambulancejateng.com/', 'Ambulance', 'alul'),
      d('ambulance.web.id', 'https://ambulance.web.id', 'Ambulance', 'alul'),
      d('ambulanceikn.com', 'https://ambulanceikn.com', 'Ambulance', 'alul'),
      d('ambulancejenazahpremium.com', 'http://ambulancejenazahpremium.com', 'Ambulance', 'alul'),
      d('ambulancejogjakarta.com', 'http://ambulancejogjakarta.com/', 'Ambulance', 'alul'),
      d('ambulanceyogyakarta.com', 'http://ambulanceyogyakarta.com/', 'Ambulance', 'alul'),
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
      d('rentalmobilikn.com', 'https://rentalmobilikn.com', 'Rental Motor', 'alul'),
      d('rentalmotorikn.com', 'https://rentalmotorikn.com', 'Rental Motor', 'alul'),
      d('sewamotorikn.com', 'https://sewamotorikn.com', 'Rental Motor', 'alul'),
      d('rentalalphardyogyakarta.com', 'https://rentalalphardyogyakarta.com', 'Rental Motor', 'alul'),
      d('sewaalphardjogja.com', 'http://sewaalphardjogja.com/', 'Rental Motor', 'alul'),
      d('rentalmotorlempuyangan.com', 'http://rentalmotorlempuyangan.com/', 'Rental Motor', 'alul'),
      d('sewamotormalioboro.com', 'https://sewamotormalioboro.com', 'Rental Motor', 'alul'),
      d('rentalmotoryogjakarta.com', 'http://rentalmotoryogjakarta.com/', 'Rental Motor', 'alul'),
      d('rentalkamerasemarang.com', 'http://rentalkamerasemarang.com/', 'Rental Motor', 'alul'),
      d('rentalmainansemarang.com', 'http://rentalmainansemarang.com/', 'Rental Motor', 'alul'),
      d('rentalalphardindonesia.com', 'https://rentalalphardindonesia.com', 'Rental Motor', 'alul'),
      d('rentalmotorindonesia.com', 'https://rentalmotorindonesia.com', 'Rental Motor', 'alul'),
      d('rentalmotorindonesia.id', 'https://rentalmotorindonesia.id', 'Rental Motor', 'alul'),
      d('rentalmotorjakarta.id', 'https://rentalmotorjakarta.id', 'Rental Motor', 'alul'),
      d('sewamotor99.com', 'http://sewamotor99.com/', 'Rental Motor', 'alul'),
      d('sewamobilikn.com', 'https://sewamobilikn.com', 'Rental Motor', 'alul'),
      d('sewasemarang.com', 'http://sewasemarang.com/', 'Rental Motor', 'alul'),
      d('sewakamerasemarang.com', 'http://sewakamerasemarang.com/', 'Rental Motor', 'alul'),
      d('sewamainansemarang.com', 'https://sewamainansemarang.com', 'Rental Motor', 'alul'),
      d('sewamobilikn.id', 'https://sewamobilikn.id', 'Rental Motor', 'alul'),
      d('sewamotorikn.id', 'https://sewamotorikn.id', 'Rental Motor', 'alul'),
      d('sewamotorbandung.info', 'https://sewamotorbandung.info', 'Rental Motor', 'alul'),
      d('sewamotorindonesia.com', 'https://sewamotorindonesia.com', 'Rental Motor', 'alul'),
      d('sewamotorindonesia.id', 'https://sewamotorindonesia.id', 'Rental Motor', 'alul'),
      d('jogjaride.com', 'https://jogjaride.com', 'Rental Motor', 'alul'),
    ],
  },
  {
    name: 'Affiliate',
    icon: '🔗',
    domains: [
      d('staffpendidikan.com', 'https://staffpendidikan.com', 'Affiliate', 'alul'),
      d('daftarunissula.com', 'https://daftarunissula.com', 'Affiliate', 'alul'),
      d('daftarunikom.com', 'https://daftarunikom.com', 'Affiliate', 'alul'),
      d('pendaftaranunissula.com', 'https://pendaftaranunissula.com', 'Affiliate', 'alul'),
      d('pendaftaranidn.com', 'http://pendaftaranidn.com/', 'Affiliate', 'alul'),
      d('daftarunpand.com', 'https://daftarunpand.com', 'Affiliate', 'alul'),
      d('pendaftaranuntag.com', 'http://pendaftaranuntag.com/', 'Affiliate', 'alul'),
    ],
  },
  {
    name: 'Badal Umroh',
    icon: '🕋',
    domains: [
      d('badalumroh.com', 'https://badalumroh.com', 'Badal Umroh', 'alul'),
      d('lp.badalumroh.com', 'https://lp.badalumroh.com', 'Badal Umroh', 'alul'),
      d('alfatihahtourtravel.com', 'https://alfatihahtourtravel.com/', 'Badal Umroh', 'alul'),
    ],
  },
  {
    name: 'Biro Hukum',
    icon: '⚖️',
    domains: [
      d('birohukum.com', 'https://birohukum.com', 'Biro Hukum', 'alul'),
      d('birohukum.org', 'https://birohukum.org/', 'Biro Hukum', 'alul'),
      d('birohukumindonesia.com', 'https://birohukumindonesia.com/', 'Biro Hukum', 'alul'),
      d('birohukum.net', 'https://birohukum.net', 'Biro Hukum', 'alul'),
      d('jasakontultasihukum.com', 'https://jasakontultasihukum.com', 'Biro Hukum', 'alul'),
      d('birohukumaceh.com', 'https://birohukumaceh.com', 'Biro Hukum', 'alul'),
      d('birohukumbali.com', 'https://birohukumbali.com', 'Biro Hukum', 'alul'),
      d('birohukumbandung.com', 'https://birohukumbandung.com', 'Biro Hukum', 'alul'),
      d('birohukumbanjarbaru.com', 'https://birohukumbanjarbaru.com', 'Biro Hukum', 'alul'),
      d('birohukumbanten.com', 'https://birohukumbanten.com', 'Biro Hukum', 'alul'),
      d('birohukumbatam.com', 'https://birohukumbatam.com', 'Biro Hukum', 'alul'),
      d('birohukumbengkulu.com', 'https://birohukumbengkulu.com', 'Biro Hukum', 'alul'),
      d('birohukumikn.com', 'https://birohukumikn.com', 'Biro Hukum', 'alul'),
      d('birohukumjabar.com', 'https://birohukumjabar.com', 'Biro Hukum', 'alul'),
      d('birohukumjakarta.com', 'https://birohukumjakarta.com', 'Biro Hukum', 'alul'),
      d('birohukumjambi.com', 'https://birohukumjambi.com', 'Biro Hukum', 'alul'),
      d('birohukummalang.com', 'https://birohukummalang.com', 'Biro Hukum', 'alul'),
      d('birohukumpadang.com', 'https://birohukumpadang.com', 'Biro Hukum', 'alul'),
      d('birohukumpalangkaraya.com', 'https://birohukumpalangkaraya.com', 'Biro Hukum', 'alul'),
      d('birohukumpalembang.com', 'https://birohukumpalembang.com', 'Biro Hukum', 'alul'),
      d('birohukumpekabaru.com', 'https://birohukumpekabaru.com', 'Biro Hukum', 'alul'),
      d('birohukumpontianak.com', 'https://birohukumpontianak.com', 'Biro Hukum', 'alul'),
      d('birohukumsurabaya.com', 'https://birohukumsurabaya.com', 'Biro Hukum', 'alul'),
      d('birohukumyogyakarta.com', 'https://birohukumyogyakarta.com', 'Biro Hukum', 'alul'),
      d('birohukummedan.com', 'https://birohukummedan.com', 'Biro Hukum', 'alul'),
      d('almadinahgroup.com', 'https://almadinahgroup.com/', 'Biro Hukum', 'alul'),
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
      d('hotelkarantinaquran.com', 'https://hotelkarantinaquran.com', 'Pendidikan', 'alul'),
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
      d('yayasanalhidayah.my.id', 'http://yayasanalhidayah.my.id', 'Alhidayah', 'alul'),
      d('yayasanalhidayah.id', 'http://yayasanalhidayah.id', 'Alhidayah', 'alul'),
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
      d('mushafquran.org', 'https://mushafquran.org/', 'Al Quran', 'dymas'),
      d('quranwakaf.com', 'https://quranwakaf.com/', 'Al Quran', 'dymas'),
      d('quranwakaf.org', 'https://quranwakaf.org/', 'Al Quran', 'dymas'),
      d('quranindonesia.org', 'https://quranindonesia.org/', 'Al Quran', 'dymas'),
      d('alquransantri.org', 'https://alquransantri.org/', 'Al Quran', 'dymas'),
      d('gudangquran.com', 'http://gudangquran.com/', 'Al Quran', 'dymas'),
      d('kurirquran.id', 'http://kurirquran.id/', 'Al Quran', 'dymas'),
      d('quranpelosok.org', 'https://quranpelosok.org/', 'Al Quran', 'dymas'),
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
      d('sumurorangtua.web.id', 'http://sumurorangtua.web.id', 'Sumur', 'dymas'),
      d('gerakanwakafsumur.com', 'http://gerakanwakafsumur.com/', 'Sumur', 'dymas'),
      d('gerakanwakafsumur.id', 'http://gerakanwakafsumur.id/', 'Sumur', 'dymas'),
      d('wakafsumur.id', 'http://wakafsumur.id/', 'Sumur', 'dymas'),
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
      d('sedekahbaitullah.com', 'http://sedekahbaitullah.com', 'Makkah', 'dymas'),
      d('donasi.sedekahbaitullah.com', 'https://donasi.sedekahbaitullah.com', 'Makkah', 'dymas'),
      d('doabaitullah.com', 'https://doabaitullah.com/', 'Makkah', 'dymas'),
      d('baitullahjourney.com', 'http://baitullahjourney.com', 'Makkah', 'dymas'),
      d('sedekahsubuhbaitullah.com', 'http://sedekahsubuhbaitullah.com/', 'Makkah', 'dymas'),
      d('sedekahbaitullah.my.id', 'http://sedekahbaitullah.my.id/', 'Makkah', 'dymas'),
    ],
  },
  {
    name: 'Doa Yatim',
    icon: '🤲',
    domains: [
      d('doayatim.com', 'https://doayatim.com/', 'Doa Yatim', 'dymas'),
      d('yatimpiatu.com', 'https://yatimpiatu.com/', 'Doa Yatim', 'dymas'),
      d('yatimindonesia.com', 'http://yatimindonesia.com/', 'Doa Yatim', 'dymas'),
    ],
  },
  {
    name: 'KSS',
    icon: '🌅',
    domains: [
      d('komunitassedekahsubuh.com', 'https://komunitassedekahsubuh.com/', 'KSS', 'dymas'),
      d('komunitassedekahsubuh.org', 'https://komunitassedekahsubuh.org/', 'KSS', 'dymas'),
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
      d('donasi.rumahanaksurga.com', 'https://donasi.rumahanaksurga.com', 'RANS', 'dilla'),
      d('rans.my.id', 'https://rans.my.id/', 'RANS', 'dilla'),
      d('rumahanak.org', 'http://rumahanak.org/', 'RANS', 'dilla'),
      d('rumahanaksurga.org', 'http://rumahanaksurga.org/', 'RANS', 'dilla'),
      d('rumahanakterlantar.com', 'https://rumahanakterlantar.com', 'RANS', 'dilla'),
      d('rumahanakterlantar.id', 'https://rumahanakterlantar.id', 'RANS', 'dilla'),
      d('rumahanakterlantar.org', 'https://rumahanakterlantar.org', 'RANS', 'dilla'),
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
      d('raa.web.id', 'https://raa.web.id', 'RAMAH', 'dilla'),
      d('rumahanakalfatihah.web.id', 'http://rumahanakalfatihah.web.id/', 'RAMAH', 'dilla'),
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
      d('qurban.alfatihah.com', 'https://qurban.alfatihah.com', 'Momentum Qurban', 'shared'),
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
