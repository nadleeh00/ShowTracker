export interface Show {
    id: number;
    name: string;
    genres: string[];
    status: string;
    rating: number;
    season: number;
    episode: number;
    dateWatched: string;
    notes: string;
  }
  
  export interface Categories {
    genres: string[];
    statuses: string[];
    [key: string]: string[];
  }
  
  export interface AppData {
    shows: Show[];
    categories: Categories;
    exportDate?: string;
    version?: string;
  }
  
  export interface FormData {
    name: string;
    genres: string[];
    status: string;
    rating: string;
    season: string;
    episode: string;
    dateWatched: string;
    notes: string;
  }
