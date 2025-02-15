import { z } from 'zod';
import { SignUp } from './Signup';
import { AuthLayout } from '@/components/Auth/auth-layout';
import { UserType } from '@/types/userTypes';
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
      <AuthLayout link="/candidate/sign-up" text="Sign Up as Candidate">
        <SignUp
          next={next}
          nextActionType={nextActionType}
          userType={userType}
        />
      </AuthLayout>
    </>
  );
}
