import { AuthLayout } from '@/components/Auth/auth-layout';
import { UserType } from '@/types/userTypes';
import { z } from 'zod';
import { Login } from './Login';
const SearchParamsSchema = z.object({
  next: z.string().optional(),
  nextActionType: z.string().optional(),
});

export default async function LoginPage(props: { searchParams: Promise<unknown> }) {
  const searchParams = await props.searchParams;
  const { next, nextActionType } = SearchParamsSchema.parse(searchParams);
  const userType: UserType = 'candidate';

  return (
    <AuthLayout userType={userType}>
      <Login
        next={next}
        nextActionType={nextActionType}
        userType={userType}
      />
    </AuthLayout>
  );
}
