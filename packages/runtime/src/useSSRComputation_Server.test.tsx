import { renderHook } from '@testing-library/react-hooks';
import { setErrorHandler } from "./errorHandler";
import useSSRComputation_Server from "./useSSRComputation_Server";

test('useSSRComputation_Server should trigger "errorHandler" when get called with an async function', () => {
  const erroneousModule = {
    compute: () => {
      throw new Error('Error for testing');
    },
  };
  const dependencies = [];
  const relativePathToCwd = '';
  const errorHandler = jest.fn();

  setErrorHandler(errorHandler);
  renderHook(() => useSSRComputation_Server(erroneousModule, dependencies, {}, relativePathToCwd));

  expect(errorHandler).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('Error for testing'),
    }),
  );
});
