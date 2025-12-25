declare module "react-quill-new" {
  import React from "react";
  export interface ReactQuillProps {
    theme?: string;
    modules?: any;
    formats?: string[];
    value?: string;
    onChange?: (value: string, delta: any, source: any, editor: any) => void;
    readOnly?: boolean;
    className?: string;
    placeholder?: string;
  }
  export default class ReactQuill extends React.Component<ReactQuillProps> {}
}
