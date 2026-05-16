-- Migration 003: Seed hardcoded domain data from domains.ts
-- Seeds custom_categories, custom_domains, and user_categories tables.
-- All INSERTs use ON CONFLICT DO NOTHING for idempotency.

BEGIN;

-- =============================================================================
-- 1. Seed categories into custom_categories
-- =============================================================================

INSERT INTO custom_categories (name, icon, owner, sort_order) VALUES
  ('Ambulance',       '🚑', 'staffwebdev', 1),
  ('Rental Motor',    '🏍️', 'staffwebdev', 2),
  ('Affiliate',       '🔗', 'staffwebdev', 3),
  ('Badal Umroh',     '🕋', 'staffwebdev', 4),
  ('Biro Hukum',      '⚖️', 'staffwebdev', 5),
  ('Pendidikan',      '📚', 'staffwebdev', 6),
  ('Event',           '📅', 'staffwebdev', 7),
  ('Alhidayah',       '🕌', 'staffwebdev', 8),
  ('Al Quran',        '📖', 'staffwebdev', 9),
  ('Sumur',           '💧', 'staffwebdev', 10),
  ('Makkah',          '🕋', 'staffwebdev', 11),
  ('Doa Yatim',       '🤲', 'staffwebdev', 12),
  ('KSS',             '🌅', 'staffwebdev', 13),
  ('RANS',            '👶', 'staffwebdev', 14),
  ('RAMAH',           '🏠', 'staffwebdev', 15),
  ('Momentum Qurban', '🐄', 'staffwebdev', 16)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 2. Seed domains into custom_domains
-- =============================================================================

-- Category: Ambulance (owner: alul)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('ambulancesemarang.com',          'https://ambulancesemarang.com',          'Ambulance', 'alul'),
  ('ambulancegratissemarang.com',    'https://ambulancegratissemarang.com',    'Ambulance', 'alul'),
  ('ambulancemedis.com',             'https://ambulancemedis.com',             'Ambulance', 'alul'),
  ('ambulancehebat.com',             'https://ambulancehebat.com',             'Ambulance', 'alul'),
  ('ambulancedemak.com',             'https://ambulancedemak.com',             'Ambulance', 'alul'),
  ('ambulancekendal.com',            'https://ambulancekendal.com',            'Ambulance', 'alul'),
  ('ambulanceungaran.com',           'https://ambulanceungaran.com',           'Ambulance', 'alul'),
  ('ambulancejateng.com',            'https://ambulancejateng.com',            'Ambulance', 'alul'),
  ('ambulance.web.id',               'https://ambulance.web.id',              'Ambulance', 'alul'),
  ('ambulanceikn.com',               'https://ambulanceikn.com',              'Ambulance', 'alul'),
  ('ambulancejenazahpremium.com',    'https://ambulancejenazahpremium.com',    'Ambulance', 'alul'),
  ('ambulancejogjakarta.com',        'https://ambulancejogjakarta.com',        'Ambulance', 'alul'),
  ('ambulanceyogyakarta.com',        'https://ambulanceyogyakarta.com',        'Ambulance', 'alul')
ON CONFLICT (url) DO NOTHING;

-- Category: Rental Motor (owner: alul)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('rentalmotorsemarang.com',        'https://rentalmotorsemarang.com',        'Rental Motor', 'alul'),
  ('rentalmotorsemarang.web.id',     'https://rentalmotorsemarang.web.id',     'Rental Motor', 'alul'),
  ('rentalmotor99.com',              'https://rentalmotor99.com',              'Rental Motor', 'alul'),
  ('rentalmotormalioboro.com',       'https://rentalmotormalioboro.com',       'Rental Motor', 'alul'),
  ('rentalmobilikn.com',             'https://rentalmobilikn.com',             'Rental Motor', 'alul'),
  ('rentalmotorikn.com',             'https://rentalmotorikn.com',             'Rental Motor', 'alul'),
  ('sewamotorikn.com',               'https://sewamotorikn.com',              'Rental Motor', 'alul'),
  ('rentalalphardyogyakarta.com',    'https://rentalalphardyogyakarta.com',    'Rental Motor', 'alul'),
  ('sewaalphardjogja.com',           'https://sewaalphardjogja.com',           'Rental Motor', 'alul'),
  ('rentalmotorlempuyangan.com',     'https://rentalmotorlempuyangan.com',     'Rental Motor', 'alul'),
  ('sewamotormalioboro.com',         'https://sewamotormalioboro.com',         'Rental Motor', 'alul'),
  ('rentalmotoryogjakarta.com',      'https://rentalmotoryogjakarta.com',      'Rental Motor', 'alul'),
  ('rentalkamerasemarang.com',       'https://rentalkamerasemarang.com',       'Rental Motor', 'alul'),
  ('rentalmainansemarang.com',       'https://rentalmainansemarang.com',       'Rental Motor', 'alul'),
  ('rentalalphardindonesia.com',     'https://rentalalphardindonesia.com',     'Rental Motor', 'alul'),
  ('rentalmotorindonesia.com',       'https://rentalmotorindonesia.com',       'Rental Motor', 'alul'),
  ('rentalmotorindonesia.id',        'https://rentalmotorindonesia.id',        'Rental Motor', 'alul'),
  ('rentalmotorjakarta.id',          'https://rentalmotorjakarta.id',          'Rental Motor', 'alul'),
  ('sewamotor99.com',                'https://sewamotor99.com',                'Rental Motor', 'alul'),
  ('sewamobilikn.com',               'https://sewamobilikn.com',              'Rental Motor', 'alul'),
  ('sewasemarang.com',               'https://sewasemarang.com',              'Rental Motor', 'alul'),
  ('sewakamerasemarang.com',         'https://sewakamerasemarang.com',         'Rental Motor', 'alul'),
  ('sewamainansemarang.com',         'https://sewamainansemarang.com',         'Rental Motor', 'alul'),
  ('sewamobilikn.id',                'https://sewamobilikn.id',               'Rental Motor', 'alul'),
  ('sewamotorikn.id',                'https://sewamotorikn.id',               'Rental Motor', 'alul'),
  ('sewamotorbandung.info',          'https://sewamotorbandung.info',          'Rental Motor', 'alul'),
  ('sewamotorindonesia.com',         'https://sewamotorindonesia.com',         'Rental Motor', 'alul'),
  ('sewamotorindonesia.id',          'https://sewamotorindonesia.id',          'Rental Motor', 'alul'),
  ('jogjaride.com',                  'https://jogjaride.com',                 'Rental Motor', 'alul')
ON CONFLICT (url) DO NOTHING;

-- Category: Affiliate (owner: alul)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('staffpendidikan.com',            'https://staffpendidikan.com',            'Affiliate', 'alul'),
  ('daftarunissula.com',             'https://daftarunissula.com',             'Affiliate', 'alul'),
  ('daftarunikom.com',               'https://daftarunikom.com',              'Affiliate', 'alul'),
  ('pendaftaranunissula.com',        'https://pendaftaranunissula.com',        'Affiliate', 'alul'),
  ('pendaftaranidn.com',             'https://pendaftaranidn.com',             'Affiliate', 'alul'),
  ('daftarunpand.com',               'https://daftarunpand.com',              'Affiliate', 'alul'),
  ('pendaftaranuntag.com',           'https://pendaftaranuntag.com',           'Affiliate', 'alul')
ON CONFLICT (url) DO NOTHING;

-- Category: Badal Umroh (owner: alul)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('badalumroh.com',                 'https://badalumroh.com',                'Badal Umroh', 'alul'),
  ('lp.badalumroh.com',              'https://lp.badalumroh.com',             'Badal Umroh', 'alul'),
  ('alfatihahtourtravel.com',        'https://alfatihahtourtravel.com',        'Badal Umroh', 'alul')
ON CONFLICT (url) DO NOTHING;

-- Category: Biro Hukum (owner: alul)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('birohukum.com',                  'https://birohukum.com',                 'Biro Hukum', 'alul'),
  ('birohukum.org',                  'https://birohukum.org',                 'Biro Hukum', 'alul'),
  ('birohukumindonesia.com',         'https://birohukumindonesia.com',         'Biro Hukum', 'alul'),
  ('birohukum.net',                  'https://birohukum.net',                 'Biro Hukum', 'alul'),
  ('jasakontultasihukum.com',        'https://jasakontultasihukum.com',        'Biro Hukum', 'alul'),
  ('birohukumaceh.com',              'https://birohukumaceh.com',              'Biro Hukum', 'alul'),
  ('birohukumbali.com',              'https://birohukumbali.com',              'Biro Hukum', 'alul'),
  ('birohukumbandung.com',           'https://birohukumbandung.com',           'Biro Hukum', 'alul'),
  ('birohukumbanjarbaru.com',        'https://birohukumbanjarbaru.com',        'Biro Hukum', 'alul'),
  ('birohukumbanten.com',            'https://birohukumbanten.com',            'Biro Hukum', 'alul'),
  ('birohukumbatam.com',             'https://birohukumbatam.com',             'Biro Hukum', 'alul'),
  ('birohukumbengkulu.com',          'https://birohukumbengkulu.com',          'Biro Hukum', 'alul'),
  ('birohukumikn.com',               'https://birohukumikn.com',              'Biro Hukum', 'alul'),
  ('birohukumjabar.com',             'https://birohukumjabar.com',             'Biro Hukum', 'alul'),
  ('birohukumjakarta.com',           'https://birohukumjakarta.com',           'Biro Hukum', 'alul'),
  ('birohukumjambi.com',             'https://birohukumjambi.com',             'Biro Hukum', 'alul'),
  ('birohukummalang.com',            'https://birohukummalang.com',            'Biro Hukum', 'alul'),
  ('birohukumpadang.com',            'https://birohukumpadang.com',            'Biro Hukum', 'alul'),
  ('birohukumpalangkaraya.com',      'https://birohukumpalangkaraya.com',      'Biro Hukum', 'alul'),
  ('birohukumpalembang.com',         'https://birohukumpalembang.com',         'Biro Hukum', 'alul'),
  ('birohukumpekabaru.com',          'https://birohukumpekabaru.com',          'Biro Hukum', 'alul'),
  ('birohukumpontianak.com',         'https://birohukumpontianak.com',         'Biro Hukum', 'alul'),
  ('birohukumsurabaya.com',          'https://birohukumsurabaya.com',          'Biro Hukum', 'alul'),
  ('birohukumyogyakarta.com',        'https://birohukumyogyakarta.com',        'Biro Hukum', 'alul'),
  ('birohukummedan.com',             'https://birohukummedan.com',             'Biro Hukum', 'alul'),
  ('almadinahgroup.com',             'https://almadinahgroup.com',             'Biro Hukum', 'alul')
ON CONFLICT (url) DO NOTHING;

-- Category: Pendidikan (owner: alul)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('alfatihahschool.com',            'https://alfatihahschool.com',            'Pendidikan', 'alul'),
  ('daycaresemarang.com',            'https://daycaresemarang.com',            'Pendidikan', 'alul'),
  ('pkbm.alfatihahhomeschooling.com','https://pkbm.alfatihahhomeschooling.com','Pendidikan', 'alul'),
  ('rumahtahfidzalfatihah.com',      'https://rumahtahfidzalfatihah.com',      'Pendidikan', 'alul'),
  ('hotelkarantinaalquran.com',      'https://hotelkarantinaalquran.com',      'Pendidikan', 'alul'),
  ('pesantrenkarantina.com',         'https://pesantrenkarantina.com',         'Pendidikan', 'alul'),
  ('pesantrenalfatihah.com',         'https://pesantrenalfatihah.com',         'Pendidikan', 'alul'),
  ('rumahquranalfatihah.com',        'https://rumahquranalfatihah.com',        'Pendidikan', 'alul'),
  ('hotelkarantinaquran.com',        'https://hotelkarantinaquran.com',        'Pendidikan', 'alul')
ON CONFLICT (url) DO NOTHING;

-- Category: Event (owner: alul)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('kajiansubuh.com',                'https://kajiansubuh.com',               'Event', 'alul'),
  ('alfatihah.id/tamantadarus',      'https://alfatihah.id/tamantadarus',     'Event', 'alul'),
  ('alfatihah.id/kelas-tahajud',     'https://alfatihah.id/kelas-tahajud',    'Event', 'alul'),
  ('alfatihah.id/challenge-hijrah',  'https://alfatihah.id/challenge-hijrah', 'Event', 'alul')
ON CONFLICT (url) DO NOTHING;

-- Category: Alhidayah (owner: alul)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('yayasanalhidayah.com',           'https://yayasanalhidayah.com',           'Alhidayah', 'alul'),
  ('alhidayahschool.sch.id',         'https://alhidayahschool.sch.id',         'Alhidayah', 'alul'),
  ('spmb.alhidayahschool.sch.id',    'https://spmb.alhidayahschool.sch.id',    'Alhidayah', 'alul'),
  ('yayasanalhidayah.my.id',         'https://yayasanalhidayah.my.id',         'Alhidayah', 'alul'),
  ('yayasanalhidayah.id',            'https://yayasanalhidayah.id',            'Alhidayah', 'alul')
ON CONFLICT (url) DO NOTHING;

-- Category: Al Quran (owner: dymas)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('sahabatquran.id',                'https://sahabatquran.id',               'Al Quran', 'dymas'),
  ('tebarquran.com',                 'https://tebarquran.com',                'Al Quran', 'dymas'),
  ('qarim.id',                       'https://qarim.id',                      'Al Quran', 'dymas'),
  ('quranpelosok.com',               'https://quranpelosok.com',              'Al Quran', 'dymas'),
  ('alfatihah.id',                   'https://alfatihah.id',                  'Al Quran', 'dymas'),
  ('rumahtahfidzalfatihah.com',      'https://rumahtahfidzalfatihah.com',     'Al Quran', 'dymas'),
  ('ekspedisiquran.com',             'https://ekspedisiquran.com',             'Al Quran', 'dymas'),
  ('lp.ekspedisiquran.com',          'https://lp.ekspedisiquran.com',          'Al Quran', 'dymas'),
  ('alquransantri.com',              'https://alquransantri.com',              'Al Quran', 'dymas'),
  ('mushafquran.org',                'https://mushafquran.org',               'Al Quran', 'dymas'),
  ('quranwakaf.com',                 'https://quranwakaf.com',                'Al Quran', 'dymas'),
  ('quranwakaf.org',                 'https://quranwakaf.org',                'Al Quran', 'dymas'),
  ('quranindonesia.org',             'https://quranindonesia.org',             'Al Quran', 'dymas'),
  ('alquransantri.org',              'https://alquransantri.org',              'Al Quran', 'dymas'),
  ('gudangquran.com',                'https://gudangquran.com',               'Al Quran', 'dymas'),
  ('kurirquran.id',                  'https://kurirquran.id',                 'Al Quran', 'dymas'),
  ('quranpelosok.org',               'https://quranpelosok.org',              'Al Quran', 'dymas')
ON CONFLICT (url) DO NOTHING;

-- Category: Sumur (owner: dymas)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('wakafsumur.com',                 'https://wakafsumur.com',                'Sumur', 'dymas'),
  ('wakafsumur.org',                 'https://wakafsumur.org',                'Sumur', 'dymas'),
  ('sumurorangtua.com',              'https://sumurorangtua.com',              'Sumur', 'dymas'),
  ('wakafsumurindonesia.com',        'https://wakafsumurindonesia.com',        'Sumur', 'dymas'),
  ('sumurorangtua.web.id',           'https://sumurorangtua.web.id',           'Sumur', 'dymas'),
  ('gerakanwakafsumur.com',          'https://gerakanwakafsumur.com',          'Sumur', 'dymas'),
  ('gerakanwakafsumur.id',           'https://gerakanwakafsumur.id',           'Sumur', 'dymas'),
  ('wakafsumur.id',                  'https://wakafsumur.id',                 'Sumur', 'dymas')
ON CONFLICT (url) DO NOTHING;

-- Category: Makkah (owner: dymas)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('tabunganwakaf.com',              'https://tabunganwakaf.com',              'Makkah', 'dymas'),
  ('sedekahnasibaitullah.com',       'https://sedekahnasibaitullah.com',       'Makkah', 'dymas'),
  ('sedekahiftar.com',               'https://sedekahiftar.com',              'Makkah', 'dymas'),
  ('sajadahmakkah.com',              'https://sajadahmakkah.com',              'Makkah', 'dymas'),
  ('sedekahbaitullah.com',           'https://sedekahbaitullah.com',           'Makkah', 'dymas'),
  ('donasi.sedekahbaitullah.com',    'https://donasi.sedekahbaitullah.com',    'Makkah', 'dymas'),
  ('doabaitullah.com',               'https://doabaitullah.com',              'Makkah', 'dymas'),
  ('baitullahjourney.com',           'https://baitullahjourney.com',           'Makkah', 'dymas'),
  ('sedekahsubuhbaitullah.com',      'https://sedekahsubuhbaitullah.com',      'Makkah', 'dymas'),
  ('sedekahbaitullah.my.id',         'https://sedekahbaitullah.my.id',         'Makkah', 'dymas')
ON CONFLICT (url) DO NOTHING;

-- Category: Doa Yatim (owner: dymas)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('doayatim.com',                   'https://doayatim.com',                  'Doa Yatim', 'dymas'),
  ('yatimpiatu.com',                 'https://yatimpiatu.com',                'Doa Yatim', 'dymas'),
  ('yatimindonesia.com',             'https://yatimindonesia.com',             'Doa Yatim', 'dymas')
ON CONFLICT (url) DO NOTHING;

-- Category: KSS (owner: dymas)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('komunitassedekahsubuh.com',      'https://komunitassedekahsubuh.com',      'KSS', 'dymas'),
  ('komunitassedekahsubuh.org',      'https://komunitassedekahsubuh.org',      'KSS', 'dymas')
ON CONFLICT (url) DO NOTHING;

-- Category: RANS (owner: dilla)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('rumahanaksurga.com',             'https://rumahanaksurga.com',            'RANS', 'dilla'),
  ('pantibayisemarang.com',          'https://pantibayisemarang.com',          'RANS', 'dilla'),
  ('pantibayi.id',                   'https://pantibayi.id',                  'RANS', 'dilla'),
  ('pantibayi.com',                  'https://pantibayi.com',                 'RANS', 'dilla'),
  ('pantibayi.org',                  'https://pantibayi.org',                 'RANS', 'dilla'),
  ('penjagabayi.com',                'https://penjagabayi.com',               'RANS', 'dilla'),
  ('rumahbayisemarang.com',          'https://rumahbayisemarang.com',          'RANS', 'dilla'),
  ('donasi.rumahanaksurga.com',      'https://donasi.rumahanaksurga.com',      'RANS', 'dilla'),
  ('rans.my.id',                     'https://rans.my.id',                    'RANS', 'dilla'),
  ('rumahanak.org',                  'https://rumahanak.org',                 'RANS', 'dilla'),
  ('rumahanaksurga.org',             'https://rumahanaksurga.org',             'RANS', 'dilla'),
  ('rumahanakterlantar.com',         'https://rumahanakterlantar.com',         'RANS', 'dilla'),
  ('rumahanakterlantar.id',          'https://rumahanakterlantar.id',          'RANS', 'dilla'),
  ('rumahanakterlantar.org',         'https://rumahanakterlantar.org',         'RANS', 'dilla')
ON CONFLICT (url) DO NOTHING;

-- Category: RAMAH (owner: dilla)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('rumahanakalfatihah.com',         'https://rumahanakalfatihah.com',         'RAMAH', 'dilla'),
  ('donasi.rumahanakalfatihah.com',  'https://donasi.rumahanakalfatihah.com',  'RAMAH', 'dilla'),
  ('pantibayijogja.com',             'https://pantibayijogja.com',             'RAMAH', 'dilla'),
  ('pantijogja.com',                 'https://pantijogja.com',                'RAMAH', 'dilla'),
  ('rumahanak.org',                  'https://rumahanak.org',                 'RAMAH', 'dilla'),
  ('anakalfatihah.com',              'https://anakalfatihah.com',              'RAMAH', 'dilla'),
  ('sayapalfatihah.com',             'https://sayapalfatihah.com',             'RAMAH', 'dilla'),
  ('harapanbayi.com',                'https://harapanbayi.com',               'RAMAH', 'dilla'),
  ('raa.web.id',                     'https://raa.web.id',                    'RAMAH', 'dilla'),
  ('rumahanakalfatihah.web.id',      'https://rumahanakalfatihah.web.id',      'RAMAH', 'dilla')
ON CONFLICT (url) DO NOTHING;

-- Category: Momentum Qurban (owner: shared)
INSERT INTO custom_domains (name, url, category_name, owner) VALUES
  ('alfatihahfarm.com',              'https://alfatihahfarm.com',              'Momentum Qurban', 'shared'),
  ('qurbanalfatihah.com',            'https://qurbanalfatihah.com',            'Momentum Qurban', 'shared'),
  ('qurbanindonesia.com',            'https://qurbanindonesia.com',            'Momentum Qurban', 'shared'),
  ('sahabatqurban.com',              'https://sahabatqurban.com',              'Momentum Qurban', 'shared'),
  ('beraniqurban.com',               'https://beraniqurban.com',              'Momentum Qurban', 'shared'),
  ('qurbanhemat.com',                'https://qurbanhemat.com',               'Momentum Qurban', 'shared'),
  ('qurbanpromo.com',                'https://qurbanpromo.com',               'Momentum Qurban', 'shared'),
  ('cintaqurban.com',                'https://cintaqurban.com',               'Momentum Qurban', 'shared'),
  ('qurbansantri.com',               'https://qurbansantri.com',              'Momentum Qurban', 'shared'),
  ('indonesiaberqurban.id',          'https://indonesiaberqurban.id',          'Momentum Qurban', 'shared'),
  ('jualqurban.com',                 'https://jualqurban.com',                'Momentum Qurban', 'shared'),
  ('qurban.alfatihah.com',           'https://qurban.alfatihah.com',           'Momentum Qurban', 'shared')
ON CONFLICT (url) DO NOTHING;

-- =============================================================================
-- 3. Seed user -> category assignments into user_categories
-- =============================================================================

-- alul: Ambulance, Rental Motor, Affiliate, Badal Umroh, Biro Hukum, Pendidikan, Event, Alhidayah, Momentum Qurban
INSERT INTO user_categories (username, category_name) VALUES
  ('alul', 'Ambulance'),
  ('alul', 'Rental Motor'),
  ('alul', 'Affiliate'),
  ('alul', 'Badal Umroh'),
  ('alul', 'Biro Hukum'),
  ('alul', 'Pendidikan'),
  ('alul', 'Event'),
  ('alul', 'Alhidayah'),
  ('alul', 'Momentum Qurban')
ON CONFLICT (username, category_name) DO NOTHING;

-- dymas: Al Quran, Sumur, Makkah, Doa Yatim, KSS, Momentum Qurban
INSERT INTO user_categories (username, category_name) VALUES
  ('dymas', 'Al Quran'),
  ('dymas', 'Sumur'),
  ('dymas', 'Makkah'),
  ('dymas', 'Doa Yatim'),
  ('dymas', 'KSS'),
  ('dymas', 'Momentum Qurban')
ON CONFLICT (username, category_name) DO NOTHING;

-- dilla: RANS, RAMAH, Momentum Qurban
INSERT INTO user_categories (username, category_name) VALUES
  ('dilla', 'RANS'),
  ('dilla', 'RAMAH'),
  ('dilla', 'Momentum Qurban')
ON CONFLICT (username, category_name) DO NOTHING;

COMMIT;
