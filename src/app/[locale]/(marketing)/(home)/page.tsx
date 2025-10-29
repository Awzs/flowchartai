import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import FaqSection from '@/components/blocks/faqs/faqs';
import FeaturesSection from '@/components/blocks/features/features';
import HeroSection from '@/components/blocks/hero/hero';
import {
  LazyAiCapabilitiesSection,
  LazyComparisonSection,
  LazyDemoSection,
} from '@/components/blocks/home/lazy-sections';
import { HowItWorksSection } from '@/components/blocks/how-it-works';
import PricingSection from '@/components/blocks/pricing/pricing';
import { TutorialsSection } from '@/components/blocks/tutorials';
import { UseCasesSection } from '@/components/blocks/use-cases';
import { constructMetadata } from '@/lib/metadata';
import { getUrlWithLocale } from '@/lib/urls/urls';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Script from 'next/script';

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    canonicalUrl: getUrlWithLocale('', locale),
  });
}

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage(props: HomePageProps) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations('HomePage');

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'ViLearning 是否提供免费试用？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '可以。Explorer 计划每天提供 1 次顶级模型调用，帮助你体验上下文工程与 Display 工厂。如需更高配额或协同能力，可升级 Pathfinder 或 Team Studio。',
        },
      },
      {
        '@type': 'Question',
        name: '如何将资料与上下文注入 ViLearning？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '你可以拖拽文档、网页或图片到 ViLearning，系统会自动清洗文本、生成语义向量，并允许配置项目提示与白板快照，确保模型聚焦重点。',
        },
      },
      {
        '@type': 'Question',
        name: '目前支持哪些 Display 形态？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '现阶段开放流程图与卡片 Display，思维导图、测验、时间线等正在内测。所有 Display 均基于统一协议，可挂载到白板并持续编辑。',
        },
      },
      {
        '@type': 'Question',
        name: '顶级大模型矩阵如何工作？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ViLearning 默认选用顶级大模型（当前测试阶段优选 DeepSeek），未来可自由切换多款模型，根据场景调用最合适的推理或结构化能力。',
        },
      },
      {
        '@type': 'Question',
        name: '团队协同与分支管理有哪些能力？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Team Studio 计划提供团队工作区、角色权限、分支对话及上下文快照，对比不同方案并满足审计需求。',
        },
      },
      {
        '@type': 'Question',
        name: 'ViLearning 如何保障数据安全？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '系统提供数据加密、访问控制、调用日志与可配置数据驻留选项。企业合规需求可通过 Team Studio 或定制方案满足。',
        },
      },
      {
        '@type': 'Question',
        name: '未来路线图包含哪些重点？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '短期内我们将上线 Display SDK、协同编辑、模型指标看板。中长期会开放自动摘要、知识库联动与 API 接口，欢迎关注 Changelog。',
        },
      },
    ],
  };

  return (
    <>
      <div className="flex flex-col">
        <HeroSection />

        <LazyDemoSection />

        <FeaturesSection />

        <LazyAiCapabilitiesSection />

        <UseCasesSection />

        <TutorialsSection />

        {false && <HowItWorksSection />}

        {false && <LazyComparisonSection />}

        <PricingSection />

        <FaqSection />

        <CallToActionSection />
      </div>

      <Script
        id="faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(faqSchema)}
      </Script>
    </>
  );
}
