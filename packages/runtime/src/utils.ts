export type Dependency = number | string | { uniqueId: string; }

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

export const calculateCacheKey = (modulePath: string, dependencies: Dependency[]): string => {
  const dependenciesString = dependencies.map((dependency) => {
    if (typeof dependency === 'number') {
      return dependency.toString();
    }
    if (typeof dependency === 'string') {
      return dependency;
    }
    return dependency.uniqueId;
  }).join(',');

  return `${modulePath}::${dependenciesString}`;
}

export const IgnoreCache = Symbol('IgnoreCache');

export const ignoreCache = (result: any) => {
  return {
    [IgnoreCache]: true,
    result,
  };
}
