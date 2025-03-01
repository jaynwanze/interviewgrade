export type SuccessServerActionState<T> = {
  message: string;
  payload: T;
  status: 'success';
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorServerActionState<T> = {
  message: string;
  status: 'error';
};

export type ServerActionState<T = undefined> =
  | {
      message: null;
      status: 'idle';
    }
  | ErrorServerActionState<T>
  | SuccessServerActionState<T>;
