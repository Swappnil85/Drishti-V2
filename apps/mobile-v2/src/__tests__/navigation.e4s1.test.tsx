import { renderApp } from '../test/utils/appRender';

describe('E4-S1: Bottom Tab Navigation Shell', () => {
  it('renders navigation container and does not crash', () => {
    const tree = renderApp();
    expect(tree.toJSON()).toBeTruthy();
  });
});
