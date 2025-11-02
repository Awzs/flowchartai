import { HeaderSection } from '@/components/layout/header-section';
import { useTranslations } from 'next-intl';

export default function ComparisonSection() {
  const t = useTranslations('HomePage.comparison');
  const traditionalItems = [
    'traditional.item-1',
    'traditional.item-2',
    'traditional.item-3',
    'traditional.item-4',
    'traditional.item-5',
    'traditional.item-6',
    'traditional.item-7',
  ] as const;
  const flowchartItems = [
    'flowchartAi.item-1',
    'flowchartAi.item-2',
    'flowchartAi.item-3',
    'flowchartAi.item-4',
    'flowchartAi.item-5',
    'flowchartAi.item-6',
    'flowchartAi.item-7',
  ] as const;

  return (
    <section id="comparison" className="px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-8 lg:space-y-16">
        <HeaderSection
          title={t('title')}
          subtitle={t('subtitle')}
          description={t('description')}
          subtitleAs="h2"
          descriptionAs="p"
        />

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Traditional Tools */}
          <div className="lg:pr-0">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold">
                {t('traditional.title')}
              </h3>
              <p className="mt-4 text-muted-foreground">
                {t('traditional.subtitle')}
              </p>
            </div>

            <ul className="space-y-4">
              {traditionalItems.map((key) => (
                <li key={key} className="pb-4 border-b border-dashed">
                  <span className="text-sm leading-relaxed">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ViLearning */}
          <div className="lg:pl-0">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold">
                {t('flowchartAi.title')}
              </h3>
              <p className="mt-4 text-muted-foreground">
                {t('flowchartAi.subtitle')}
              </p>
            </div>

            <ul className="space-y-4">
              {flowchartItems.map((key) => (
                <li key={key} className="pb-4 border-b border-dashed">
                  <span className="text-sm leading-relaxed">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
