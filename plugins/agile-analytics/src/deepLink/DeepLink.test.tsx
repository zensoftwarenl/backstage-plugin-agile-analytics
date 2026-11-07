import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CopyLinkButton, DeepLinkParams, deepLinkUrl } from './DeepLink';

describe('deepLinkUrl', () => {
  beforeEach(() =>
    window.history.replaceState(null, '', '/errors?hours=24&q=api#old'),
  );

  it('names the item as the fragment and keeps the query', () => {
    expect(deepLinkUrl('cityhub-dev-43ae')).toBe(
      'http://localhost/errors?hours=24&q=api#cityhub-dev-43ae',
    );
  });

  it('sets the choices given and leaves out the undefined ones', () => {
    expect(
      deepLinkUrl('cityhub-dev-43ae/abc', {
        hours: '168',
        status: 'open,acknowledged',
        q: undefined,
      }),
    ).toBe(
      'http://localhost/errors?hours=168&status=open%2Cacknowledged#cityhub-dev-43ae/abc',
    );
  });
});

describe('CopyLinkButton', () => {
  it('copies the link with the page choices', async () => {
    window.history.replaceState(null, '', '/cloud');
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <MemoryRouter>
        <DeepLinkParams.Provider value={{ hours: '72' }}>
          <CopyLinkButton target="cityhub-dev-43ae" label="CityHub dev" />
        </DeepLinkParams.Provider>
      </MemoryRouter>,
    );
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Copy link to CityHub dev'));
    });
    expect(writeText).toHaveBeenCalledWith(
      'http://localhost/cloud?hours=72#cityhub-dev-43ae',
    );
  });
});
