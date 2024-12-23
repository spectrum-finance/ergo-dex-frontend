import { Box, Flex, Typography, useDevice } from '@ergolabs/ui-kit';
import { Suspense, useEffect } from 'react';
import * as React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { BehaviorSubject, first, mapTo, Observable, tap, zip } from 'rxjs';

import { routesConfig } from './ApplicationRoutes';
import { useObservable } from './common/hooks/useObservable';
import { analyticsInitializer } from './common/initializers/analyticsInitializer';
import { gaInitializer } from './common/initializers/gaInitializer';
import { networkDomInitializer } from './common/initializers/networkDomInitializer';
import { sentryInitializer } from './common/initializers/sentryInitializer';
import { startAppTicks } from './common/streams/appTick';
import { Glow } from './components/common/Layout/Glow/Glow';
import { ErrorEventProvider } from './components/ErrorBoundary/ErrorEventProvider';
import { useApplicationSettings } from './context';
import { useBodyClass } from './hooks/useBodyClass';
import { useMetaThemeColor } from './hooks/useMetaThemeColor';
import { LanguageProvider } from './i18n/i18n';
import { isDarkOsTheme } from './utils/osTheme';

const initializers: Observable<boolean>[] = [
  sentryInitializer(),
  analyticsInitializer(),
  networkDomInitializer(routesConfig),
  gaInitializer(),
];

const isAppInitialized$ = new BehaviorSubject(false);
const initializeApp = () => {
  zip(initializers)
    .pipe(
      mapTo(true),
      tap(() => startAppTicks()),
      first(),
    )
    .subscribe(isAppInitialized$);
};

export const ApplicationInitializer: React.FC = () => {
  const [{ theme }] = useApplicationSettings();
  const [] = useObservable(isAppInitialized$, [], false);
  const { s } = useDevice();

  useBodyClass([theme]);
  useMetaThemeColor(
    {
      dark: '#1D1D1D',
      light: `#F0F2F5`,
      hosky: '#1D1D1D',
      snek: '#1D1D1D',
      'snek-dark': '#1D1D1D',
      get system() {
        return isDarkOsTheme() ? this.dark : this.light;
      },
    },
    theme,
  );
  useEffect(() => initializeApp(), []);

  return (
    <Suspense fallback={''}>
      <ErrorEventProvider>
        <BrowserRouter>
          <LanguageProvider>
            <Glow />
            <Flex
              align="center"
              justify="center"
              style={{ height: s ? undefined : '100%' }}
            >
              <Box borderRadius="xl" padding={s ? [4, 4, 20, 4] : 4}>
                <Flex style={{ maxWidth: '500px' }} col>
                  <Typography.Body>Dear Community Member,</Typography.Body>
                  <br />
                  <Typography.Body>
                    We want to inform you of an important update regarding
                    Spectrum Finance project. After careful consideration, we’ve
                    decided to discontinue support for the current Spectrum DEX
                    interface. This change is a significant step in our
                    evolution, as we shift our focus to new platforms that align
                    more closely with our future vision.
                  </Typography.Body>
                  <br />
                  <Typography.Body>
                    Spectrum DEX has been split into two distinct platforms:
                    ErgoDEX on the Ergo blockchain and Splash on the Cardano
                    blockchain. This isn’t just a rebranding but a strategic
                    move to enhance clarity and purpose.
                  </Typography.Body>
                  <br />
                  <Typography.Body>
                    Our decision stems from a commitment to advancing Spectrum
                    Network, a groundbreaking cross-chain decentralized
                    technology.{' '}
                    <b>
                      By separating Spectrum Network from the DEXes, we aim to
                      eliminate any confusion, allowing each platform to grow
                      independently without overlap.
                    </b>
                  </Typography.Body>
                  <br />
                  <Typography.Body>
                    All Cardano liquidity pools have been migrated to Splash
                    DEX, and all Ergo liquidity pools to ErgoDEX, ensuring a
                    seamless trading experience on both platforms.
                  </Typography.Body>
                  <br />
                  <Typography.Body>
                    Moving forward, our development focus will be on Spectrum
                    Network, representing our vision for a future of cross-chain
                    interoperability. By concentrating on this technology, we
                    believe we can drive greater adoption and deliver more value
                    to our community.
                  </Typography.Body>
                  <br />
                  <Typography.Body>
                    We understand transitions can be challenging, and we deeply
                    appreciate your continued support. We’re confident that both
                    ErgoDEX and Splash will serve you well as they grow.
                  </Typography.Body>
                  <br />
                  <Typography.Body>
                    Thank you for being part of our community. We’re excited
                    about the opportunities ahead.
                  </Typography.Body>
                  <br />
                  <Typography.Body>Best regards,</Typography.Body>
                  <Typography.Body>The Spectrum Finance Team</Typography.Body>
                  <br />
                  <Flex row>
                    <Flex.Item marginRight={4}>
                      <Typography.Link href="https://ergodex.io">
                        ErgoDEX (Ergo network)
                      </Typography.Link>
                    </Flex.Item>
                    <Flex.Item>
                      <Typography.Link href="https://splash.trade">
                        Splash (Cardano network)
                      </Typography.Link>
                    </Flex.Item>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </LanguageProvider>
        </BrowserRouter>
      </ErrorEventProvider>
    </Suspense>
  );
};
