export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ApiErrorBody {
  error: string;
}

export interface HouseProjectConfig {
  floors: number;
  hasGarage: boolean;
  garageCars: number;
  textureType: string;
  foundationType: string;
  floorColors: string[];
  floorTextureTypes?: string[];
  roofType?: string;
  architecturalStyle?: string;
  amkPresetId?: string;
  selectedPresetId?: string | null;
  veranda: {
    hasVeranda: boolean;
    material: string;
    fenceStyle: string;
    isBaseClosed: boolean;
    width: number;
    length: number;
    perimeterOffset?: number;
    baseColor?: string;
  };
  rooms: number;
  partitionMaterial: string;
  openings: Array<{
    id?: string;
    type: string;
    floor: number;
    perimeterOffset: number;
    variant?: string;
  }>;
}

export interface ProjectSummary {
  id: string;
  title: string;
  version: number;
  floors: number | null;
  texture_type: string | null;
  architectural_style: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends ProjectSummary {
  config: HouseProjectConfig;
}

export interface ProjectListResponse {
  items: ProjectSummary[];
  next_cursor: string | null;
  total: number;
}
