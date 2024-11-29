export interface Manga {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: Tag[];
}

export interface Tag {
  attributes: {
    name: {
      en: string;
    };
  };
}
