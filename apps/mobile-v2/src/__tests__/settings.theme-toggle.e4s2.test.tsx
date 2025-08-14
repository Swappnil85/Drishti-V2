import { renderApp } from '../test/utils/appRender';

describe('E4-S2: Theme provider smoke', () => {
  it('renders app without crashing', () => {
    const tree = renderApp();
    expect(tree.toJSON()).toBeTruthy();
  });
});
