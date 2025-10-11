export type CategoryNode = {
  key: number;
  name: string;
  label: string;
  unit?: string;
  department?: string;
  children?: CategoryNode[];
};


export type CategoryNodeTag = {
    id: string;
    key: string;
    ko: string;
    en: string;
    children?: CategoryNodeTag[];
  };
  