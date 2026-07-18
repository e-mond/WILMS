import { redirect } from 'next/navigation';

/** Collector 1:1 messaging removed from product navigation — keep route safe. */
export default function CollectorMessagesPage() {
  redirect('/collector/dashboard');
}
