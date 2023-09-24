export let fetchSubscriptions : () => void = () => undefined;

let fetchSubscriptionsPromise = new Promise<void>((resolve) => {
  fetchSubscriptions = () => resolve();
});

export const stopFetchingSubscriptionsForTesting = () => {
  fetchSubscriptions = () => undefined;
  fetchSubscriptionsPromise = new Promise<void>((resolve) => {
    fetchSubscriptions = () => resolve();
  });
}

export async function runOnSubscriptionsResumed<T>(callback: () => T) {
  await fetchSubscriptionsPromise;
  return callback();
}
