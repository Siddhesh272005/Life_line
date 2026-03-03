interface Requests {
  id: number | string;
  name: string;
  bloodGroup: string;
  blodgroup?: string;
  place: string;
  condition: string;
  requestType?: string;
  location: string;
  time: string;
  requestId?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  units: number;
  phone: string;
  hospital: string;
  address: string;
  notes: string;
  patientCoordinate: [number, number];
  responderCoordinate: [number, number];
  respondersCount?: number;
  respondersLimit?: number;
  slotsRemaining?: number;
  requestStatus?: 'open' | 'responded' | 'closed';
  hasResponded?: boolean;
  hasDonated?: boolean;
  currentResponderStatus?: 'responded' | 'donated' | 'cancelled' | 'expired' | null;
  currentResponderExpiresAt?: string | null;
}

interface donors {
  id: number | string;
  name: string;
  place: string;
}

interface RewardToken {
  id: number;
  name: string;
  points: number;
  image: ReturnType<typeof require>;
}
