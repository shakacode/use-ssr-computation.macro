export type Dependency = number | string | { uniqueId: string; }

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
