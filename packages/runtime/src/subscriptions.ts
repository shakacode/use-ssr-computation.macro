export let fetchSubscriptions : () => void = () => undefined;

let fetchSubscriptionsPromise = new Promise<void>((resolve) => {
  fetchSubscriptions = () => resolve();
});

// Used only in unit tests to reset the subscription state before the start of the next test. Not exported to the user.
export const resetFetchingSubscriptionsForTesting = () => {
  fetchSubscriptions = () => undefined;
  fetchSubscriptionsPromise = new Promise<void>((resolve) => {
    fetchSubscriptions = () => resolve();
  });
}

export async function runOnSubscriptionsResumed<T>(callback: () => T) {
  await fetchSubscriptionsPromise;
  return callback();
}
