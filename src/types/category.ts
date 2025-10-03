export type CategoryNode = {
  key: number;
  name: string;
  label: string;
  unit?: string;
  department?: string;
  children?: CategoryNode[];
};


export type CategoryNodeTag = {
    key: string;
    ko: string;
    en: string;
    children?: CategoryNodeTag[];
  };
  