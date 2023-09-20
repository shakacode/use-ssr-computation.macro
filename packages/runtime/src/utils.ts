export type Dependency = number | string | { uniqueId: string; }

export type Options = {
  skip?: boolean,
};

export function isDependency(element: any): element is Dependency {
  return typeof element === 'number' || typeof element === 'string' || (typeof element === 'object' && element.uniqueId !== undefined);
}

export function parseDependencies(dependencies: any): Dependency[] {
  if (!Array.isArray(dependencies)) {
    throw new Error('Dependencies must be an array.');
  }

  return dependencies.map((dependency) => {
    if (isDependency(dependency)) {
      return dependency;
    }
    throw new Error(`useSSRComputation: dependency ${dependency} is not a valid dependency object`);
  });
}

const mapDependencyToValue = (dependency: Dependency): string => {
  if (typeof dependency === 'number') {
    return dependency.toString();
  }
  if (typeof dependency === 'string') {
    return dependency;
  }
  return dependency.uniqueId;
}

export const calculateCacheKey = (modulePath: string, dependencies: Dependency[]): string => {
  const dependenciesString = dependencies.map(mapDependencyToValue).join(',');

  return `${modulePath}::${dependenciesString}`;
}

export type ServerComputationFunction = (...dependencies: any[]) => any;
export type ClientComputationFunction = () => Promise<{ default: (...dependencies: any[]) => any }>

export type SSRComputationFunction<Fn extends ServerComputationFunction | ClientComputationFunction> = (
  fn: Fn,
  dependencies: any[],
  options: any,
  relativePathToCwd: string
) => any;

export type ServerFunction = SSRComputationFunction<ServerComputationFunction>;
export type ClientFunction = SSRComputationFunction<ClientComputationFunction>;

export type Subscription = {
  unsubscribe: () => void;
}

export type Observer<T> = {
  next: (value: T) => void;
  error?: (error: any) => void;
}

export type Observable<T> = {
  current: T | null;
  subscribe: (observer: Observer<T>) => Subscription;
}

export const isObservable = <T>(obj: any): obj is Observable<T> => {
  return obj && typeof obj.subscribe === "function" && "current" in obj;
};

export const isPromise = <T>(obj: any): obj is Promise<T> => {
  return obj && typeof obj.then === "function";
};
