declare module 'mind-elixir-react' {
  import type {
    CSSProperties,
    ForwardRefExoticComponent,
    RefAttributes,
  } from 'react';

  interface MindElixirReactHandle {
    instance?: {
      getData?: () => any;
      destroy?: () => void;
    };
  }

  interface MindElixirReactProps {
    data: any;
    options?: Record<string, unknown>;
    plugins?: unknown[];
    style?: CSSProperties;
    onOperate?: (operation: unknown) => void;
    onSelectNode?: (...args: unknown[]) => void;
    onExpandNode?: (...args: unknown[]) => void;
  }

  const MindElixirReact: ForwardRefExoticComponent<
    MindElixirReactProps & RefAttributes<MindElixirReactHandle>
  >;

  export default MindElixirReact;
}
