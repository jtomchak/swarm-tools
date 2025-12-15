import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Mermaid } from '@/components/mdx/mermaid';
import { AsciiBanner, AsciiArt } from '@/components/mdx/ascii-banner';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    AsciiBanner,
    AsciiArt,
    ...components,
  };
}
