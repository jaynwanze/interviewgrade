import { AuthLayout } from '@/components/Auth/auth-layout';
import { UserType } from '@/types/userTypes';
import { z } from 'zod';
import { Login } from './Login';
const SearchParamsSchema = z.object({
  next: z.string().optional(),
  nextActionType: z.string().optional(),
});

export default function LoginPage({ searchParams }: { searchParams: unknown }) {
  const { next, nextActionType } = SearchParamsSchema.parse(searchParams);
  const userType: UserType = 'candidate';

  return (
    <>
      <AuthLayout link="/employer/login" text="Log In as Employer">
        <Login
          next={next}
          nextActionType={nextActionType}
          userType={userType}
        />
      </AuthLayout>
    </>
  );
}
