import { useCallback } from 'react';
import { act, fireEvent } from '@testing-library/react-native';
import useDebug from './useDebug';
import useAnalytics from './useAnalytics';

const useTest = (options = {}) => {
  const {
    namespace = 'test',
    recordActions = true,
    recordAssertions = true,
  } = options;

  const debug = useDebug({ namespace });
  const { trackEvent } = useAnalytics();

  // Record test action
  const recordAction = useCallback((action, meta = {}) => {
    if (!recordActions) return;

    debug.info(`Test action: ${action}`, meta);
    trackEvent('test_action', {
      action,
      ...meta,
    });
  }, [debug, recordActions, trackEvent]);

  // Record test assertion
  const recordAssertion = useCallback((assertion, result, meta = {}) => {
    if (!recordAssertions) return;

    debug.info(`Test assertion: ${assertion}`, {
      result,
      ...meta,
    });
    trackEvent('test_assertion', {
      assertion,
      result,
      ...meta,
    });
  }, [debug, recordAssertions, trackEvent]);

  // Simulate press event
  const simulatePress = useCallback(async (element) => {
    await act(async () => {
      fireEvent.press(element);
    });
    recordAction('press', { element: element.props.testID });
  }, [recordAction]);

  // Simulate change text event
  const simulateChangeText = useCallback(async (element, text) => {
    await act(async () => {
      fireEvent.changeText(element, text);
    });
    recordAction('changeText', {
      element: element.props.testID,
      text,
    });
  }, [recordAction]);

  // Simulate scroll event
  const simulateScroll = useCallback(async (element, offset) => {
    await act(async () => {
      fireEvent.scroll(element, {
        nativeEvent: {
          contentOffset: offset,
        },
      });
    });
    recordAction('scroll', {
      element: element.props.testID,
      offset,
    });
  }, [recordAction]);

  // Wait for element
  const waitForElement = useCallback(async (getElement, timeout = 5000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = getElement();
      if (element) {
        recordAction('waitForElement', {
          found: true,
          duration: Date.now() - startTime,
        });
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    recordAction('waitForElement', {
      found: false,
      timeout,
    });
    return null;
  }, [recordAction]);

  // Assert element exists
  const assertElementExists = useCallback((element, message) => {
    const exists = element !== null && element !== undefined;
    recordAssertion('elementExists', exists, { message });
    expect(element).toBeTruthy();
  }, [recordAssertion]);

  // Assert element has text
  const assertElementHasText = useCallback((element, text, message) => {
    const hasText = element.props.children === text;
    recordAssertion('elementHasText', hasText, {
      message,
      expected: text,
      actual: element.props.children,
    });
    expect(element.props.children).toBe(text);
  }, [recordAssertion]);

  // Assert element has style
  const assertElementHasStyle = useCallback((element, style, message) => {
    const hasStyle = Object.entries(style).every(
      ([key, value]) => element.props.style[key] === value
    );
    recordAssertion('elementHasStyle', hasStyle, {
      message,
      expected: style,
      actual: element.props.style,
    });
    expect(element.props.style).toMatchObject(style);
  }, [recordAssertion]);

  // Assert element is enabled
  const assertElementIsEnabled = useCallback((element, message) => {
    const isEnabled = !element.props.disabled;
    recordAssertion('elementIsEnabled', isEnabled, { message });
    expect(element.props.disabled).toBeFalsy();
  }, [recordAssertion]);

  // Assert element is disabled
  const assertElementIsDisabled = useCallback((element, message) => {
    const isDisabled = element.props.disabled === true;
    recordAssertion('elementIsDisabled', isDisabled, { message });
    expect(element.props.disabled).toBeTruthy();
  }, [recordAssertion]);

  // Assert element is visible
  const assertElementIsVisible = useCallback((element, message) => {
    const isVisible = element.props.style?.display !== 'none' &&
                     element.props.style?.visibility !== 'hidden';
    recordAssertion('elementIsVisible', isVisible, { message });
    expect(isVisible).toBeTruthy();
  }, [recordAssertion]);

  // Assert element matches snapshot
  const assertElementMatchesSnapshot = useCallback((element, message) => {
    recordAssertion('elementMatchesSnapshot', true, { message });
    expect(element).toMatchSnapshot();
  }, [recordAssertion]);

  // Mock API response
  const mockApiResponse = useCallback((endpoint, response, options = {}) => {
    const { status = 200, delay = 0 } = options;

    jest.spyOn(global, 'fetch').mockImplementation(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json: () => Promise.resolve(response),
          });
        }, delay);
      })
    );

    recordAction('mockApiResponse', {
      endpoint,
      response,
      status,
      delay,
    });
  }, [recordAction]);

  // Mock API error
  const mockApiError = useCallback((endpoint, error, options = {}) => {
    const { status = 500, delay = 0 } = options;

    jest.spyOn(global, 'fetch').mockImplementation(() =>
      new Promise((_, reject) => {
        setTimeout(() => {
          reject({
            status,
            message: error,
          });
        }, delay);
      })
    );

    recordAction('mockApiError', {
      endpoint,
      error,
      status,
      delay,
    });
  }, [recordAction]);

  return {
    // Event simulation
    simulatePress,
    simulateChangeText,
    simulateScroll,
    waitForElement,

    // Assertions
    assertElementExists,
    assertElementHasText,
    assertElementHasStyle,
    assertElementIsEnabled,
    assertElementIsDisabled,
    assertElementIsVisible,
    assertElementMatchesSnapshot,

    // API mocking
    mockApiResponse,
    mockApiError,

    // Recording
    recordAction,
    recordAssertion,
  };
};

// Example usage with component testing
export const useComponentTest = (component) => {
  const test = useTest({ namespace: `component:${component}` });

  const renderComponent = useCallback((props = {}) => {
    const { render } = require('@testing-library/react-native');
    const Component = require(`../components/${component}`).default;
    return render(<Component {...props} />);
  }, [component]);

  return {
    ...test,
    renderComponent,
  };
};

// Example usage with screen testing
export const useScreenTest = (screen) => {
  const test = useTest({ namespace: `screen:${screen}` });

  const renderScreen = useCallback((props = {}) => {
    const { render } = require('@testing-library/react-native');
    const Screen = require(`../screens/${screen}`).default;
    return render(<Screen {...props} />);
  }, [screen]);

  return {
    ...test,
    renderScreen,
  };
};

export default useTest;
