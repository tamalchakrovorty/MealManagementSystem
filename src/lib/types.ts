export type Role = "manager" | "moderator" | "member";

export type MembershipStatus = "pending" | "active" | "left";

export type RequestType = "meal_off" | "meal_on" | "guest_meal" | "join";

export type RequestStatus = "pending" | "approved" | "rejected";

export type MealSlot = "lunch" | "dinner";

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Mess {
  id: string;
  name: string;
  mess_code: string;
  created_by: string;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  mess_id: string;
  role: Role;
  status: MembershipStatus;
  joined_at: string;
}

export interface MealEntry {
  id: string;
  mess_id: string;
  user_id: string;
  date: string;
  slot: MealSlot;
  quantity: number;
  is_guest: boolean;
  created_at: string;
}

export interface BazarExpense {
  id: string;
  mess_id: string;
  user_id: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface Deposit {
  id: string;
  mess_id: string;
  user_id: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface Notice {
  id: string;
  mess_id: string;
  author_id: string;
  message: string;
  target_type: "all" | "group" | "individual";
  target_user_ids: string[] | null;
  created_at: string;
  edited_at: string | null;
}

export interface Request {
  id: string;
  mess_id: string;
  user_id: string;
  type: RequestType;
  status: RequestStatus;
  details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface FreezerStock {
  id: string;
  mess_id: string;
  item: string;
  quantity: number;
  unit: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  mess_id: string;
  date: string;
  lunch: string | null;
  dinner: string | null;
}

export type NotificationType =
  | "announcement"
  | "group_notice"
  | "personal_notice"
  | "event"
  | "assigned_bazar"
  | "meal_request_accepted"
  | "guest_meal_accepted";

export interface Notification {
  id: string;
  user_id: string;
  mess_id: string;
  type: NotificationType;
  message: string;
  read_at: string | null;
  created_at: string;
  edited_at: string | null;
}
