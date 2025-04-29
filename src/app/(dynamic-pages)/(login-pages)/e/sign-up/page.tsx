import { AuthLayout } from '@/components/Auth/auth-layout';
import { UserType } from '@/types/userTypes';
import { z } from 'zod';
import { SignUp } from './Signup';
const SearchParamsSchema = z.object({
  next: z.string().optional(),
  nextActionType: z.string().optional(),
});

export default function SignupPage({
  searchParams,
}: {
  searchParams: unknown;
}) {
  const { next, nextActionType } = SearchParamsSchema.parse(searchParams);
  const userType: UserType = 'employer';
  return (
    <>
      <AuthLayout
        link="/c/sign-up"
        text="Sign Up as Candidate"
        userType={userType}
      >
        <SignUp
          next={next}
          nextActionType={nextActionType}
          userType={userType}
        />
      </AuthLayout>
    </>
  );
}
