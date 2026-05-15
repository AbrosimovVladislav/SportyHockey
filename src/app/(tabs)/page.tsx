import { Screen } from '@/components/screen';
import { useT } from '@/hooks/use-t';

export default function HomePage() {
  const t = useT();
  return <Screen title={t('home.title')} />;
}
