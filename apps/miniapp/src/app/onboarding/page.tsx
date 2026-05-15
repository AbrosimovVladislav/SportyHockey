import { Screen } from '@/components/screen';
import { useT } from '@/hooks/use-t';

export default function OnboardingPage() {
  const t = useT();
  return <Screen title={t('onboarding.title')} />;
}
