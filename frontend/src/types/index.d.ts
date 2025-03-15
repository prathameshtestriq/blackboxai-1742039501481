// Global type declarations
declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

// Environment variables
declare module '@env' {
  export const API_BASE_URL: string;
  export const WS_URL: string;
  export const APP_NAME: string;
  export const APP_VERSION: string;
}

// Custom type definitions
type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  MainApp: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Matches: undefined;
  Players: undefined;
  Wallet: undefined;
  Profile: undefined;
};

type MatchStackParamList = {
  MatchesList: undefined;
  MatchDetails: { matchId: string };
};

type PlayerStackParamList = {
  PlayersList: undefined;
  PlayerDetails: { playerId: string };
};

type ProfileStackParamList = {
  ProfileMain: undefined;
  Portfolio: undefined;
  TransactionHistory: undefined;
  BankAccounts: undefined;
  NotificationSettings: undefined;
  SecuritySettings: undefined;
  Support: undefined;
  About: undefined;
};

// Extend existing types
declare module 'react-native' {
  interface ViewStyle {
    elevation?: number;
  }
}

// Redux related types
interface Action<T = any> {
  type: string;
  payload?: T;
  error?: boolean;
  meta?: any;
}

interface AsyncAction extends Action {
  promise: Promise<any>;
}

// API Response types
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User related types
interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

// Match related types
interface Match {
  _id: string;
  teams: {
    name: string;
    logo: string;
  }[];
  venue: {
    name: string;
    location: string;
  };
  format: string;
  status: string;
  startTime: string;
  endTime?: string;
  scores: {
    team1: {
      runs: number;
      wickets: number;
      overs: number;
    };
    team2: {
      runs: number;
      wickets: number;
      overs: number;
    };
  };
  result?: {
    winner: string;
    description: string;
  };
}

// Player related types
interface Player {
  _id: string;
  name: string;
  role: string;
  team: string;
  profileImage: string;
  statistics: {
    matches: number;
    batting: {
      runs: number;
      average: number;
      strikeRate: number;
    };
    bowling: {
      wickets: number;
      economy: number;
      average: number;
    };
  };
  stock: {
    currentPrice: number;
    availableVolume: number;
  };
  priceChangePercentage: number;
}

// Transaction related types
interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  details?: {
    player?: {
      _id: string;
      name: string;
    };
    quantity?: number;
    pricePerUnit?: number;
  };
}
