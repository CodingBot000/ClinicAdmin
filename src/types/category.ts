export type CategoryNode = {
  key: number;
  name: string;
  label: string;
  unit?: string;
  department?: string;
  children?: CategoryNode[];
};
