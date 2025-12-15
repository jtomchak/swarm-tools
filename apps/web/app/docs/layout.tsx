import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import type { ReactNode } from 'react';
import { BookOpen, Cog, FlaskConical } from 'lucide-react';

/**
 * Icon mapping for sidebar tabs based on folder URL
 */
const tabIcons: Record<string, React.ReactNode> = {
  '/docs/guide': <BookOpen className="size-4" />,
  '/docs/reference': <Cog className="size-4" />,
  '/docs/research': <FlaskConical className="size-4" />,
};

/**
 * Sidebar banner with bee ASCII art
 */
function SidebarBanner() {
  return (
    <div className="mb-4 rounded-lg border border-fd-border bg-fd-card p-3 text-center">
      <pre className="ascii-art text-xs leading-tight">
        {`    ⬡ ⬡ ⬡
   ⬡ 🐝 ⬡
    ⬡ ⬡ ⬡`}
      </pre>
      <p className="mt-2 text-xs text-fd-muted-foreground">
        Multi-agent primitives
      </p>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      sidebar={{
        banner: <SidebarBanner />,
        tabs: {
          transform: (option) => ({
            ...option,
            icon: tabIcons[option.url] ?? option.icon,
          }),
        },
      }}
    >
      {children}
    </DocsLayout>
  );
}
