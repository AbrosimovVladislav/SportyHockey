import { Screen } from '@/components/screen';
import { useT } from '@/hooks/use-t';

export default function EventsPage() {
  const t = useT();
  return <Screen title={t('events.title')} />;
}
