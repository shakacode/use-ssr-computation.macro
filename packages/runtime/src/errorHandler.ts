export class UnsupportedAsyncResultOnServerSideError extends Error {
  asyncResult: Promise<any>;
  constructor(asyncResult: Promise<any>) {
    super('useSSRComputation does not support async functions on the server side');
    this.name = 'UnsupportedAsyncResultOnServerSideError';
    this.asyncResult = asyncResult;
  }
}

type ErrorHandler = (error: Error) => void;
let errorHandler: ErrorHandler = () => {};

export const setErrorHandler = (handler: ErrorHandler) => {
  errorHandler = handler;
}

export const handleError = (error: Error) => {
  if (typeof errorHandler === 'function') {
    errorHandler(error);
  } else {
    console.error(error);
  }
}
