export let fetchSubscriptions : () => void = () => undefined;

const fetchSubscriptionsPromise = new Promise<void>((resolve) => {
  fetchSubscriptions = () => resolve();
});

export async function runOnSubscriptionsResumed<T>(callback: () => T) {
  await fetchSubscriptionsPromise;
  return callback();
}
