import { ReactNode } from 'react';

export function CustomHead({ children }: { children: ReactNode }) {
  return (
    <>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="description" content="InterviewGrade" />
      <link rel="icon" href="/public/logos/InterviewGrade.png" />
      {children}
    </>
  );
}
