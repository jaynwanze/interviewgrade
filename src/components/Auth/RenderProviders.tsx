import * as SocialIcons from '@/components/Auth/Icons';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { T } from '@/components/ui/Typography';
import { AuthProvider } from '@/types';
import { Fragment } from 'react';

function capitalize(word: string) {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
}

const isDemo = false;

export const RenderProviders = ({
  providers,
  onProviderLoginRequested,
  isLoading,
}: {
  providers: AuthProvider[];
  onProviderLoginRequested: (provider: AuthProvider) => void;
  isLoading: boolean;
}) => {
  return (
    <div className="space-y-2.5 flex flex-col">
      {providers.map((provider) => {
        const AuthIcon = SocialIcons[provider];
        const component = (
          <Button
            variant="secondary"
            size="default"
            disabled={isLoading || isDemo}
            onClick={() => onProviderLoginRequested(provider)}
            className="h-10 rounded-lg"
          >
            <div className="mr-2">
              <AuthIcon />
            </div>
            <span className="">{capitalize(provider)}</span>
          </Button>
        );
        return (
          <Fragment key={provider}>
            {isDemo ? (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="w-full [&>button]:w-full">{component}</div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 border-border text-foreground">
                  <T.Small className="text-muted-foreground">
                    ⚠️ As this is a demo, the social media authentication
                    buttons aren't linked. However, you can connect them in your
                    dev environment using the supabase dashboard for your
                    project.
                  </T.Small>
                </HoverCardContent>
              </HoverCard>
            ) : (
              component
            )}
          </Fragment>
        );
      })}
    </div>
  );
};
