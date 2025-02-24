// custom-elements.d.ts
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'calcite-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          icon?: string;
          scale?: string;
          onClick?: () => void;
          className?: string;
        },
        HTMLElement
      >;
    }
  }
}