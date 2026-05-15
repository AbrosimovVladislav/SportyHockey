import { Screen } from '@/components/screen';
import { useT } from '@/hooks/use-t';

export default function SquadPage() {
  const t = useT();
  return <Screen title={t('squad.title')} />;
}
