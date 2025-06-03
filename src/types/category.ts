export type CategoryNode = {
    key: number;
    name: string;
    label: string;
    children?: CategoryNode[];
  };