export type SuccessServerActionState<T> = {
  message: string;
  payload: T;
  status: 'success';
};

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
