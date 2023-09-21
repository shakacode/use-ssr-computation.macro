import {
  ClientComputationFunction,
  Dependency,
  ServerComputationFunction,
  SSRComputationHook,
} from "./utils";

export class InternalUseSSRComputationError extends Error {
  result: any;
  constructor(message: string, result) {
    super(message);
    this.name = 'InternalUseSSRComputationError';
    this.result = result;
  }
}

export class UseSSRComputationError extends Error {
  dependencies: Dependency[];
  error?: any;
  result?: any;
  ssrComputationFile: string;
  constructor(message: string, dependencies: Dependency[], ssrComputationFile: string, error?: any, partialResult?: any) {
    super(message);
    this.name = 'UseSSRComputationError';
    this.dependencies = dependencies;
    this.error = error;
    this.result = partialResult;
    this.ssrComputationFile = ssrComputationFile;
  }
}

type ErrorHandler = (error: UseSSRComputationError) => void;
let errorHandler: ErrorHandler = () => {};

export const setErrorHandler = (handler: ErrorHandler) => {
  errorHandler = handler;
}

export const handleError = (error: UseSSRComputationError) => {
  if (typeof errorHandler === 'function') {
    errorHandler(error);
  } else {
    console.error(error);
  }
}

export const wrapErrorHandler = <TResult, T extends ServerComputationFunction<TResult> | ClientComputationFunction<TResult>>(useSSRComputation: SSRComputationHook<TResult, T>): SSRComputationHook<TResult, T> => {
  return (...args: Parameters<SSRComputationHook<TResult, T>>): TResult | null => {
    try {
      return useSSRComputation(...args);
    } catch (error) {
      let message = '';
      let result = null;

      if (error instanceof InternalUseSSRComputationError) {
        message = error.message;
        result = error.result;
      } else {
        message = String(error);
      }

      const [_, dependencies, __, relativePathToCwd] = args;
      const useSSRComputationError = new UseSSRComputationError(message, dependencies, relativePathToCwd, error, result);
      handleError(useSSRComputationError);
      return result;
    }
  };
}
