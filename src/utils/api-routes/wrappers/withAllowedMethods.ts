import { NextApiRequest, NextApiResponse } from 'next';

export const withAllowedMethods = (
  allowedMethods: string[],
  cb: (req: NextApiRequest, res: NextApiResponse, ...args: unknown[]) => void,
) => {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    ...args: unknown[]
  ) => {
    if (!req.method) {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).json({
        error: 'Method not allowed',
      });
    }
    return cb(req, res, ...args);
  };
};
