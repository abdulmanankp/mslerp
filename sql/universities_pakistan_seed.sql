-- ============================================================
-- Pakistan Universities — Full Seed (HEC Recognized)
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
-- Adds `sector` column if it doesn't already exist
-- ============================================================

alter table public.universities
  add column if not exists sector text not null default 'Public'
  check (sector in ('Public', 'Private'));

-- ============================================================
-- FEDERAL (Islamabad Capital Territory) — Public
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('Air University',                                                        'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Allama Iqbal Open University (AIOU)',                                   'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Bahria University',                                                     'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('COMSATS University Islamabad',                                          'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Federal Urdu University of Arts, Sciences & Technology',               'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Institute of Space Technology',                                         'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('International Islamic University Islamabad',                            'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('National Defense University',                                           'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('National University of Modern Languages (NUML)',                        'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('National University of Sciences & Technology (NUST)',                   'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Pakistan Institute of Development Economics (PIDE)',                    'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Pakistan Institute of Engineering & Applied Sciences (PIEAS)',          'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Quaid-i-Azam University',                                              'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Virtual University of Pakistan',                                        'Federal (Islamabad)', 'Islamabad', 'Public',  'Active'),
  ('Shaheed Zulfikar Ali Bhutto Institute of Science & Technology (SZABIST Islamabad)', 'Federal (Islamabad)', 'Islamabad', 'Public', 'Active')
on conflict (name) do nothing;

-- ============================================================
-- FEDERAL (Islamabad Capital Territory) — Private
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('Foundation University Islamabad',                                       'Federal (Islamabad)', 'Islamabad', 'Private', 'Active'),
  ('National University of Computer & Emerging Sciences (FAST-NUCES)',      'Federal (Islamabad)', 'Islamabad', 'Private', 'Active'),
  ('Riphah International University',                                       'Federal (Islamabad)', 'Islamabad', 'Private', 'Active'),
  ('Capital University of Science & Technology',                            'Federal (Islamabad)', 'Islamabad', 'Private', 'Active'),
  ('Muslim Youth University',                                               'Federal (Islamabad)', 'Islamabad', 'Private', 'Active'),
  ('Iqra University Islamabad',                                             'Federal (Islamabad)', 'Islamabad', 'Private', 'Active'),
  ('Hamdard University Islamabad',                                          'Federal (Islamabad)', 'Islamabad', 'Private', 'Active')
on conflict (name) do nothing;

-- ============================================================
-- PUNJAB — Public
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('University of the Punjab',                                              'Punjab', 'Lahore',         'Public',  'Active'),
  ('University of Engineering & Technology (UET) Lahore',                  'Punjab', 'Lahore',         'Public',  'Active'),
  ('Government College University Lahore',                                  'Punjab', 'Lahore',         'Public',  'Active'),
  ('Lahore College for Women University',                                   'Punjab', 'Lahore',         'Public',  'Active'),
  ('King Edward Medical University',                                        'Punjab', 'Lahore',         'Public',  'Active'),
  ('Fatima Jinnah Medical University',                                      'Punjab', 'Lahore',         'Public',  'Active'),
  ('University of Health Sciences Lahore',                                  'Punjab', 'Lahore',         'Public',  'Active'),
  ('National College of Arts Lahore',                                       'Punjab', 'Lahore',         'Public',  'Active'),
  ('Minhaj University Lahore',                                              'Punjab', 'Lahore',         'Public',  'Active'),
  ('Fatima Jinnah Women University',                                        'Punjab', 'Rawalpindi',     'Public',  'Active'),
  ('University of Engineering & Technology (UET) Taxila',                  'Punjab', 'Taxila',         'Public',  'Active'),
  ('Pir Mehr Ali Shah Arid Agriculture University Rawalpindi',              'Punjab', 'Rawalpindi',     'Public',  'Active'),
  ('University of Agriculture Faisalabad',                                  'Punjab', 'Faisalabad',     'Public',  'Active'),
  ('Government College University Faisalabad',                              'Punjab', 'Faisalabad',     'Public',  'Active'),
  ('University of Sargodha',                                               'Punjab', 'Sargodha',       'Public',  'Active'),
  ('Bahauddin Zakariya University',                                         'Punjab', 'Multan',         'Public',  'Active'),
  ('Khwaja Fareed University of Engineering & IT',                          'Punjab', 'Rahim Yar Khan', 'Public',  'Active'),
  ('Islamia University of Bahawalpur',                                      'Punjab', 'Bahawalpur',     'Public',  'Active'),
  ('Government Sadiq College Women University',                             'Punjab', 'Bahawalpur',     'Public',  'Active'),
  ('Ghazi University',                                                      'Punjab', 'Dera Ghazi Khan','Public',  'Active'),
  ('University of Education Lahore',                                        'Punjab', 'Lahore',         'Public',  'Active'),
  ('University of Gujrat',                                                  'Punjab', 'Gujrat',         'Public',  'Active'),
  ('University of Okara',                                                   'Punjab', 'Okara',          'Public',  'Active'),
  ('University of Narowal',                                                 'Punjab', 'Narowal',        'Public',  'Active'),
  ('University of Sahiwal',                                                 'Punjab', 'Sahiwal',        'Public',  'Active'),
  ('University of Jhang',                                                   'Punjab', 'Jhang',          'Public',  'Active'),
  ('Women University Multan',                                               'Punjab', 'Multan',         'Public',  'Active'),
  ('University of Chakwal',                                                 'Punjab', 'Chakwal',        'Public',  'Active'),
  ('University of Sialkot (Public)',                                        'Punjab', 'Sialkot',        'Public',  'Active')
on conflict (name) do nothing;

-- ============================================================
-- PUNJAB — Private
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('Lahore University of Management Sciences (LUMS)',                       'Punjab', 'Lahore',   'Private', 'Active'),
  ('Beaconhouse National University',                                       'Punjab', 'Lahore',   'Private', 'Active'),
  ('Forman Christian College University',                                   'Punjab', 'Lahore',   'Private', 'Active'),
  ('University of Central Punjab',                                          'Punjab', 'Lahore',   'Private', 'Active'),
  ('Superior University Lahore',                                            'Punjab', 'Lahore',   'Private', 'Active'),
  ('Hajvery University',                                                    'Punjab', 'Lahore',   'Private', 'Active'),
  ('University of Management & Technology (UMT)',                           'Punjab', 'Lahore',   'Private', 'Active'),
  ('Garrison University Lahore',                                            'Punjab', 'Lahore',   'Private', 'Active'),
  ('Lahore Leads University',                                               'Punjab', 'Lahore',   'Private', 'Active'),
  ('The University of Lahore',                                              'Punjab', 'Lahore',   'Private', 'Active'),
  ('Sharif Medical & Dental College',                                       'Punjab', 'Lahore',   'Private', 'Active'),
  ('CMH Lahore Medical College',                                            'Punjab', 'Lahore',   'Private', 'Active'),
  ('GIFT University',                                                       'Punjab', 'Gujranwala','Private', 'Active'),
  ('HITEC University',                                                      'Punjab', 'Taxila',   'Private', 'Active'),
  ('Ali Institute of Education',                                            'Punjab', 'Lahore',   'Private', 'Active'),
  ('Sialkot University',                                                    'Punjab', 'Sialkot',  'Private', 'Active'),
  ('University of South Asia',                                              'Punjab', 'Lahore',   'Private', 'Active')
on conflict (name) do nothing;

-- ============================================================
-- SINDH — Public
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('University of Karachi',                                                 'Sindh', 'Karachi',   'Public',  'Active'),
  ('NED University of Engineering & Technology',                            'Sindh', 'Karachi',   'Public',  'Active'),
  ('Institute of Business Administration (IBA) Karachi',                   'Sindh', 'Karachi',   'Public',  'Active'),
  ('University of Sindh',                                                  'Sindh', 'Jamshoro',  'Public',  'Active'),
  ('Mehran University of Engineering & Technology',                         'Sindh', 'Jamshoro',  'Public',  'Active'),
  ('Liaquat University of Medical & Health Sciences',                       'Sindh', 'Jamshoro',  'Public',  'Active'),
  ('Shah Abdul Latif University',                                           'Sindh', 'Khairpur',  'Public',  'Active'),
  ('Quaid-e-Awam University of Engineering, Science & Technology',          'Sindh', 'Nawabshah', 'Public',  'Active'),
  ('University of Agriculture Tando Jam',                                   'Sindh', 'Tando Jam', 'Public',  'Active'),
  ('Benazir Bhutto Shaheed University',                                     'Sindh', 'Lyari',     'Public',  'Active'),
  ('Shaheed Benazir Bhutto University of Veterinary & Animal Sciences',     'Sindh', 'Sakrand',   'Public',  'Active'),
  ('University of Turbat (Sindh Campus)',                                   'Sindh', 'Karachi',   'Public',  'Active'),
  ('Government College University Hyderabad',                               'Sindh', 'Hyderabad', 'Public',  'Active'),
  ('Sindh Agriculture University',                                          'Sindh', 'Tando Jam', 'Public',  'Active')
on conflict (name) do nothing;

-- ============================================================
-- SINDH — Private
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('Aga Khan University',                                                   'Sindh', 'Karachi',  'Private', 'Active'),
  ('Baqai Medical University',                                              'Sindh', 'Karachi',  'Private', 'Active'),
  ('DHA Suffa University',                                                  'Sindh', 'Karachi',  'Private', 'Active'),
  ('Greenwich University',                                                  'Sindh', 'Karachi',  'Private', 'Active'),
  ('Indus University',                                                      'Sindh', 'Karachi',  'Private', 'Active'),
  ('Indus Valley School of Art & Architecture',                             'Sindh', 'Karachi',  'Private', 'Active'),
  ('Dadabhoy Institute of Higher Education',                                'Sindh', 'Karachi',  'Private', 'Active'),
  ('Barret Hodgson University',                                             'Sindh', 'Karachi',  'Private', 'Active'),
  ('Hamdard University Karachi',                                            'Sindh', 'Karachi',  'Private', 'Active'),
  ('Szabist Karachi',                                                       'Sindh', 'Karachi',  'Private', 'Active'),
  ('Ziauddin University',                                                   'Sindh', 'Karachi',  'Private', 'Active'),
  ('Institute of Business Management (IoBM)',                               'Sindh', 'Karachi',  'Private', 'Active'),
  ('PAF-KIET',                                                              'Sindh', 'Karachi',  'Private', 'Active'),
  ('Jinnah Sindh Medical University',                                       'Sindh', 'Karachi',  'Private', 'Active'),
  ('Karachi Institute of Economics & Technology (KIET)',                    'Sindh', 'Karachi',  'Private', 'Active'),
  ('Muhammad Ali Jinnah University',                                        'Sindh', 'Karachi',  'Private', 'Active')
on conflict (name) do nothing;

-- ============================================================
-- KHYBER PAKHTUNKHWA — Public
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('University of Peshawar',                                                'Khyber Pakhtunkhwa', 'Peshawar',         'Public',  'Active'),
  ('University of Engineering & Technology Peshawar',                       'Khyber Pakhtunkhwa', 'Peshawar',         'Public',  'Active'),
  ('Islamia College University Peshawar',                                   'Khyber Pakhtunkhwa', 'Peshawar',         'Public',  'Active'),
  ('Institute of Management Sciences Peshawar',                             'Khyber Pakhtunkhwa', 'Peshawar',         'Public',  'Active'),
  ('Khyber Medical University',                                             'Khyber Pakhtunkhwa', 'Peshawar',         'Public',  'Active'),
  ('Agricultural University Peshawar',                                      'Khyber Pakhtunkhwa', 'Peshawar',         'Public',  'Active'),
  ('Abdul Wali Khan University Mardan',                                     'Khyber Pakhtunkhwa', 'Mardan',           'Public',  'Active'),
  ('Bacha Khan University',                                                 'Khyber Pakhtunkhwa', 'Charsadda',        'Public',  'Active'),
  ('University of Swabi',                                                   'Khyber Pakhtunkhwa', 'Swabi',            'Public',  'Active'),
  ('Hazara University',                                                     'Khyber Pakhtunkhwa', 'Mansehra',         'Public',  'Active'),
  ('Abbottabad University of Science & Technology',                         'Khyber Pakhtunkhwa', 'Abbottabad',       'Public',  'Active'),
  ('Gomal University',                                                      'Khyber Pakhtunkhwa', 'Dera Ismail Khan', 'Public',  'Active'),
  ('University of Science & Technology Bannu',                              'Khyber Pakhtunkhwa', 'Bannu',            'Public',  'Active'),
  ('University of Malakand',                                                'Khyber Pakhtunkhwa', 'Malakand',         'Public',  'Active'),
  ('University of Swat',                                                    'Khyber Pakhtunkhwa', 'Swat',             'Public',  'Active'),
  ('Women University Swabi',                                                'Khyber Pakhtunkhwa', 'Swabi',            'Public',  'Active'),
  ('University of Chitral',                                                 'Khyber Pakhtunkhwa', 'Chitral',          'Public',  'Active'),
  ('University of Lakki Marwat',                                            'Khyber Pakhtunkhwa', 'Lakki Marwat',     'Public',  'Active'),
  ('University of Haripur',                                                 'Khyber Pakhtunkhwa', 'Haripur',          'Public',  'Active'),
  ('Kohat University of Science & Technology',                              'Khyber Pakhtunkhwa', 'Kohat',            'Public',  'Active')
on conflict (name) do nothing;

-- ============================================================
-- KHYBER PAKHTUNKHWA — Private
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('Abasyn University',                                                     'Khyber Pakhtunkhwa', 'Peshawar', 'Private', 'Active'),
  ('CECOS University of IT & Emerging Sciences',                            'Khyber Pakhtunkhwa', 'Peshawar', 'Private', 'Active'),
  ('City University of Science & IT',                                       'Khyber Pakhtunkhwa', 'Peshawar', 'Private', 'Active'),
  ('Ghulam Ishaq Khan Institute of Engineering Sciences & Technology (GIKI)','Khyber Pakhtunkhwa', 'Swabi',  'Private', 'Active'),
  ('Iqra National University',                                              'Khyber Pakhtunkhwa', 'Peshawar', 'Private', 'Active'),
  ('Qurtuba University',                                                    'Khyber Pakhtunkhwa', 'Peshawar', 'Private', 'Active'),
  ('Sarhad University of Science & IT',                                     'Khyber Pakhtunkhwa', 'Peshawar', 'Private', 'Active'),
  ('Preston University Peshawar',                                           'Khyber Pakhtunkhwa', 'Peshawar', 'Private', 'Active'),
  ('Riphah International University Peshawar',                              'Khyber Pakhtunkhwa', 'Peshawar', 'Private', 'Active')
on conflict (name) do nothing;

-- ============================================================
-- BALOCHISTAN — Public
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('University of Balochistan',                                             'Balochistan', 'Quetta',   'Public',  'Active'),
  ('Balochistan University of Information Technology, Engineering & Management Sciences (BUITEMS)', 'Balochistan', 'Quetta', 'Public', 'Active'),
  ('Sardar Bahadur Khan Women''s University',                               'Balochistan', 'Quetta',   'Public',  'Active'),
  ('University of Turbat',                                                  'Balochistan', 'Turbat',   'Public',  'Active'),
  ('University of Khuzdar',                                                 'Balochistan', 'Khuzdar',  'Public',  'Active'),
  ('Balochistan University of Engineering & Technology',                    'Balochistan', 'Khuzdar',  'Public',  'Active'),
  ('Lasbela University of Agriculture, Water & Marine Sciences',            'Balochistan', 'Lasbela',  'Public',  'Active'),
  ('University of Loralai',                                                 'Balochistan', 'Loralai',  'Public',  'Active'),
  ('University of Makran',                                                  'Balochistan', 'Panjgur',  'Public',  'Active'),
  ('Bolan University of Medical & Health Sciences',                         'Balochistan', 'Quetta',   'Public',  'Active')
on conflict (name) do nothing;

-- ============================================================
-- BALOCHISTAN — Private
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('Al-Hamd Islamic University',                                            'Balochistan', 'Quetta',   'Private', 'Active'),
  ('Greenwich University Gwadar Campus',                                    'Balochistan', 'Gwadar',   'Private', 'Active')
on conflict (name) do nothing;

-- ============================================================
-- AZAD JAMMU & KASHMIR — Public
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('University of Azad Jammu & Kashmir',                                   'Azad Kashmir', 'Muzaffarabad', 'Public',  'Active'),
  ('University of Kotli',                                                   'Azad Kashmir', 'Kotli',        'Public',  'Active'),
  ('University of Poonch',                                                  'Azad Kashmir', 'Rawalakot',    'Public',  'Active'),
  ('Women University of Azad Jammu & Kashmir',                              'Azad Kashmir', 'Bagh',         'Public',  'Active'),
  ('Mirpur University of Science & Technology',                             'Azad Kashmir', 'Mirpur',       'Public',  'Active')
on conflict (name) do nothing;

-- ============================================================
-- GILGIT-BALTISTAN — Public
-- ============================================================
insert into public.universities (name, province, city, sector, status) values
  ('Karakoram International University',                                    'Gilgit-Baltistan', 'Gilgit',    'Public',  'Active'),
  ('Karakoram International University Diamer Campus',                      'Gilgit-Baltistan', 'Diamer',    'Public',  'Active'),
  ('Karakoram International University Ghanche Campus',                     'Gilgit-Baltistan', 'Ghanche',   'Public',  'Active')
on conflict (name) do nothing;

-- ============================================================
-- Verification query — run after insert to confirm counts
-- ============================================================
select
  province,
  sector,
  count(*) as total
from public.universities
group by province, sector
order by province, sector;
