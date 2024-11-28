export interface IMeetingData {
  stats: IStats;
  joinedMeeting: IMeeting[];
  hostedMeeting: IMeeting[];
}

export interface IStats {
  arrangingMeeting: number;
  scheduledMeeting: number;
  hostedMeeting: number;
  joinedMeeting: number;
}

export interface IMeeting {
  id: string;
  title: string;
  meetingType: string;
  description?: string;
  location?: string;
  note?: string;
  isAllDay?: boolean;
  startTime: string;
  endTime: string;
  status: string;
  participants: IParticipant[];
  dateType: string;
  dateSelections: IDateSelection[];
  createdAt: string;
  updatedAt: string;
}

export interface IParticipant {
  id: string;
  role: string;
  responseStatus: string;
  user: IUser;
}

export interface IDateSelection {
  id: string;
  isFinal: boolean;
  date: IDate;
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  image: string;
  timeZone: string;
}

export interface IDate {
  id: string;
  date: string;
}

export interface IOverviewProps {
  overviewData?: IMeetingData;
}

export interface IMeetingListProps {
  meetingListData?: IMeeting[];
}
