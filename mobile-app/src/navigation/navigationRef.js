/**
 * navigationRef.js
 *
 * A module-level navigation reference so we can navigate from
 * outside React components (e.g. notification tap listeners in App.js).
 */
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

export const reset = (state) => {
  if (navigationRef.isReady()) {
    navigationRef.reset(state);
  }
};
