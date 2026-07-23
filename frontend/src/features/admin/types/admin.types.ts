export type EmployeeListItem = {
  id: string;

  employee_no: string;

  display_name: string;

  email: string;

  avatar_url: string | null;

  role: string;

  employment_status: string;

  employment_type: string;

  department: string | null;

  position: string | null;

  shift: string | null;

  attendance_policy: string | null;
};

export type EmployeeListResponse = {
  employees: EmployeeListItem[];
};

export type EmployeeListRequest = {
  action: "EMPLOYEE_LIST";
};

export type AdminUser = {
  user_id: string;

  email: string;

  full_name: string | null;

  role: string;

  department_id: string | null;

  position_id: string | null;

  shift_id: string | null;

  status: string;
};
