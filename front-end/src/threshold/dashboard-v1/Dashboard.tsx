import Login from './Login';
import Console from './Console';
import { useSession } from './session';
import { useTheme } from '../useTheme';

/** /dashboard — demo shell. Shows the sign-in flow first, then the console. */
export default function Dashboard() {
  useTheme('threshold-dark');
  const { session, signIn, signOut } = useSession();
  return session ? <Console session={session} onSignOut={signOut} /> : <Login onSignIn={signIn} />;
}
