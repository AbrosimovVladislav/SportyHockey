import { Screen } from '@/components/screen';
import { useT } from '@/hooks/use-t';

export default function MoneyPage() {
  const t = useT();
  return <Screen title={t('money.title')} />;
}
