import { PageGuidanceTip } from '@/components/feedback/PageGuidanceTip';
import { PAGE_GUIDANCE, type PageGuidanceKey } from '@/constants/page-guidance';

export interface ModulePageIntroProps {
  guidanceKey: PageGuidanceKey;
}

export function ModulePageIntro({ guidanceKey }: ModulePageIntroProps) {
  const guidance = PAGE_GUIDANCE[guidanceKey];

  return (
    <PageGuidanceTip
      title={guidance.title}
      body={guidance.body}
      example={guidance.example}
      className="mb-wilms-4"
    />
  );
}
