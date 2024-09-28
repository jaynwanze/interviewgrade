import { NextApiResponse } from 'next';
import { Stripe } from 'stripe';
import { errors } from '../errors';

interface PotentialStripeError {
  type?: string;
}

function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  const potentialError = error as PotentialStripeError;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof potentialError.type === 'string'
  );
}

function isStripeErrorWithRawMessage(
  error: unknown,
): error is Stripe.errors.StripeError & {
  raw: {
    message: string;
  };
} {
  return (
    isStripeError(error) &&
    'raw' in error &&
    typeof error.raw === 'object' &&
    error.raw !== null &&
    'message' in error.raw &&
    typeof error.raw.message === 'string'
  );
}

export const handleError = (error: unknown, res: NextApiResponse) => {
  errors.add(error);
  if (isStripeErrorWithRawMessage(error)) {
    const errorObject = new Error(error.raw.message);
    return res.status(500).json({
      message: errorObject.message,
    });
  } else if (isStripeError(error)) {
    return res
      .status(error.statusCode ?? 500)
      .json(new Error(error.message ?? 'Unknown error'));
  } else if (error instanceof Error) {
    return res.status(500).json({
      message: error.message,
    });
  } else {
    const errorObject = new Error(String(error));
    return res.status(500).json({
      message: errorObject.message,
    });
  }
};
