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

export type SSRComputationModule<TResult> = {
  compute: (...dependencies: Dependency[]) => TResult;
  subscribe?: (next: (result: TResult) => void, ...dependencies: Dependency[]) => Subscription;
};
export type ServerComputationFunction<TResult> = SSRComputationModule<TResult>;
export type ClientComputationFunction<TResult> = () => Promise<SSRComputationModule<TResult>>

export type SSRComputationHook<TResult, Fn extends ServerComputationFunction<TResult> | ClientComputationFunction<TResult>> = (
  fn: Fn,
  dependencies: Dependency[],
  options: Options,
  relativePathToCwd: string
) => TResult | null;

export type ServerHook<TResult> = SSRComputationHook<TResult, ServerComputationFunction<TResult>>;
export type ClientHook<TResult> = SSRComputationHook<TResult, ClientComputationFunction<TResult>>;

export type Subscription = {
  unsubscribe: () => void;
}

export type Observer<TResult> = {
  next: (value: TResult) => void;
}

export type Observable<T> = {
  current: T | null;
  subscribe: (observer: Observer<T>) => Subscription;
}
