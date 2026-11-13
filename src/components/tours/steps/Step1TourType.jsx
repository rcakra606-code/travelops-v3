import { Compass, Building2, Globe2, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const TOUR_TYPES = [
  {
    id: 'Series',
    title: 'Series Tour',
    badge: 'Reguler Group Departure',
    badgeColor: '#0284c7',
    icon: Compass,
    iconColor: '#0284c7',
    description:
      'Paket tour grup reguler dengan jadwal keberangkatan pasti (fixed departure) yang dikelola langsung.',
    features: [
      'Format data tour standar & pax list',
      'Termasuk modul verifikasi Form Claim MDR',
      'Kalkulasi diskon supplier & diskon cabang',
      'Tracking pelunasan & invoice resmi'
    ]
  },
  {
    id: 'Incentive',
    title: 'Incentive Tour',
    badge: 'Private & Corporate Group',
    badgeColor: '#8b5cf6',
    icon: Building2,
    iconColor: '#8b5cf6',
    description:
      'Tour kustomisasi khusus perusahaan, instansi, atau keluarga besar dengan itinerary dan vendor khusus.',
    features: [
      'Terintegrasi kolom Supplier / Land Operator rekanan',
      'Modul Form Claim MDR otomatis disembunyikan',
      'Fleksibilitas harga dan margin profit kustom',
      'SOP penagihan corporate / split invoicing'
    ]
  },
  {
    id: 'Consortium',
    title: 'Consortium Tour',
    badge: 'Joint Wholesaler Departure',
    badgeColor: '#10b981',
    icon: Globe2,
    iconColor: '#10b981',
    description:
      'Paket konsorsium gabungan bersama wholesaler rekanan (misal: TX Travel, AntaVaya, Golden Rama, dll).',
    features: [
      'Terintegrasi kolom Supplier Mitra Konsorsium',
      'Perhitungan Airport Tax & Fuel Surcharge (Wajib)',
      'Perhitungan Tipping Tour Leader/Guide/Driver (Wajib)',
      'Perhitungan PPN (Wajib) & Misc Charge (Optional)',
      'Kalkulasi otomatis Nominal Profit & Modal Nett'
    ]
  }
];

const Step1TourType = ({ data, updateData }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const currentType = data.tourType || 'Series';

  const handleSelectType = (typeId) => {
    const patch = { tourType: typeId };
    if (typeId === 'Series') {
      patch.category = 'Leisure';
    } else if (typeId === 'Incentive') {
      patch.category = 'Corporate / Incentive';
      patch.claimMdr = false;
    } else if (typeId === 'Consortium') {
      patch.category = 'Consortium';
      patch.claimMdr = false;
    }
    updateData(patch);
  };

  return (
    <div className="fade-in flex flex-col gap-6">
      <div className="text-center max-w-xl mx-auto mb-2">
        <h3 className="text-xl font-extrabold text-text-main mb-2">
          Pilih Klasifikasi Jenis Tour
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">
          Pilih kategori alur tour untuk mengaktifkan skema perhitungan finansial, modul supplier, dan rincian pax yang tepat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TOUR_TYPES.map((t) => {
          const isSelected = currentType === t.id;
          const IconComp = t.icon;

          return (
            <div
              key={t.id}
              onClick={() => handleSelectType(t.id)}
              className={`relative flex flex-col justify-between p-6 rounded-2xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
                isSelected
                  ? isLight
                    ? 'bg-white border-2 shadow-lg'
                    : 'bg-white/5 border-2 shadow-xl'
                  : isLight
                    ? 'bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300'
                    : 'bg-bg-card border border-border hover:border-border-hover'
              }`}
              style={{
                padding: '1.5rem 1.65rem',
                borderColor: isSelected ? t.badgeColor : undefined
              }}
            >
              <div>
                {/* Header Icon + Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{
                      background: isSelected ? `${t.iconColor}1a` : isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                      color: t.iconColor
                    }}
                  >
                    <IconComp size={24} />
                  </div>

                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: `${t.badgeColor}18`,
                      color: t.badgeColor
                    }}
                  >
                    {isSelected && <CheckCircle2 size={13} />}
                    {t.badge}
                  </span>
                </div>

                <h4 className="text-lg font-extrabold text-text-main mb-1.5">
                  {t.title}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed mb-5">
                  {t.description}
                </p>

                {/* Features List */}
                <div className="pt-3.5 border-t border-border/40 flex flex-col gap-2">
                  {t.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs ${
                        isSelected ? 'text-text-main font-medium' : 'text-text-muted'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background: isSelected ? t.badgeColor : 'var(--text-muted)'
                        }}
                      />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Pill */}
              <div className="mt-6 flex items-center justify-end">
                <span
                  className="text-xs font-bold transition-colors"
                  style={{ color: isSelected ? t.badgeColor : 'var(--text-muted)' }}
                >
                  {isSelected ? '✓ Terpilih' : 'Pilih Modul →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Step1TourType;
