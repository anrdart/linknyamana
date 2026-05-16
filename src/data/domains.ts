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
  emailNotify?: boolean
  isArchived?: boolean
}

export interface DomainCategory {
  name: string
  icon: string
  domains: Domain[]
}

export interface WPStep {
  category: string
  task: string
  location: string
}

export const WORDPRESS_SETUP_STEPS: WPStep[] = [
  { category: 'Pembersihan', task: 'Hapus Post "Hello World" & Page "Sample Page"', location: 'Posts & Pages' },
  { category: 'Pembersihan', task: 'Kosongkan Trash (Sampah) & Hapus Plugin Bawaan', location: 'Plugins' },
  { category: 'Struktur', task: 'Isi Site Title, Tagline, Site Icon & Atur Timezone (UTC+7)', location: 'Settings > General' },
  { category: 'Struktur', task: 'Matikan auto-comment (Moderasi Manual)', location: 'Settings > Discussion' },
  { category: 'Struktur', task: 'WAJIB: Ubah Permalink ke Post Name', location: 'Settings > Permalinks' },
  { category: 'Plugins', task: 'Instal & Setup Rank Math SEO (Advanced Mode)', location: 'Plugins > Add New' },
  { category: 'Plugins', task: 'Instal Elementor & ElementsKit', location: 'Plugins > Add New' },
  { category: 'Plugins', task: 'Instal LiteSpeed Cache (Optimasi Speed)', location: 'Plugins > Add New' },
  { category: 'Plugins', task: 'Instal Wordfence (Keamanan Login)', location: 'Plugins > Add New' },
  { category: 'Tampilan', task: 'Instal Tema Ringan (Astra/GeneratePress/Hello)', location: 'Appearance > Themes' },
  { category: 'Tampilan', task: 'Upload Logo & Favicon (Icon Tab)', location: 'Appearance > Customize' },
  { category: 'Tampilan', task: 'Buat Menu Utama & Atur Widget Sidebar/Footer', location: 'Appearance > Menus' },
  { category: 'Halaman', task: 'Buat & Set Halaman Beranda (Homepage)', location: 'Pages > Add New' },
  { category: 'Halaman', task: 'Buat Halaman Kontak, About, & Privacy Policy', location: 'Pages > Add New' },
  { category: 'SEO', task: 'Hubungkan Rank Math ke Search Console & Analytics', location: 'Rank Math > Dashboard' },
  { category: 'SEO', task: 'Pastikan Sitemap XML Aktif & Terbaca', location: 'Rank Math > Sitemap' },
  { category: 'Final Check', task: 'Tes Kecepatan Web & Tampilan di HP (Mobile)', location: 'Browser / GTMetrix' },
  { category: 'Speed', task: 'Konfigurasi WebP (Convert Gambar Otomatis)', location: 'LiteSpeed/Smush' },
  { category: 'SEO', task: 'Aktifkan 404 Monitor & Redirections', location: 'Rank Math' },
  { category: 'SEO', task: 'Setup Google Indexing API (Cepat Terindeks)', location: 'Rank Math' },
  { category: 'Content', task: 'Buat 1 Artikel Pilar (Utama) sebagai Fondasi', location: 'Posts > Add New' },
  { category: 'Tracking', task: 'Cek apakah data Google Analytics sudah masuk', location: 'GA4 Dashboard' },
  { category: 'Security', task: 'Setup Auto-Backup Mingguan', location: 'Hosting/Plugin' },
] as const
