import { AxiosError } from 'axios';

function isAxiosError(error: unknown): error is AxiosError<Error> {
  const axiosError = error as AxiosError<Error>;
  return Boolean(
    axiosError.isAxiosError &&
      axiosError.response &&
      'message' in axiosError.response.data,
  );
}
export function getPossibleAxiosErrorMessage(error: unknown): string {
  console.log(error);
  if (!isAxiosError(error)) {
    return String(error);
  } else {
    let errMsg = 'An error occurred';
    // AxiosError has a 'message' property directly
    if (error.message) {
      errMsg = error.message;
    }
    // The error response might have more specific details
    if (error.response?.data) {
      errMsg = error.response.data.message;
    }
    return errMsg;
  }
}
