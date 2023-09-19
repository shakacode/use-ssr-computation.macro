import { renderHook } from '@testing-library/react-hooks';
import { setErrorHandler } from "./errorHandler";
import useSSRComputation_Server from "./useSSRComputation_Server";

test('useSSRComputation_Server should trigger "errorHandler" when get called with an async function', () => {
  const asyncFn = () => Promise.resolve('result');
  const dependencies = [];
  const relativePathToCwd = '';
  const errorHandler = jest.fn();

  setErrorHandler(errorHandler);
  renderHook(() => useSSRComputation_Server(asyncFn, dependencies, {}, relativePathToCwd));

  expect(errorHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('does not support async functions on the server side'),
    }),
  );
});
