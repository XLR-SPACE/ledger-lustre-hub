const API_BASE = "https://ml.xlr.ovh/api";

// Types
export interface User {
  user_id: number;
  username: string;
  name: string;
  email: string;
  user_type: string;
  created_at: string;
  updated_at: string;
  default_wallet_id?: number;
}

export interface Wallet {
  wallet_id: number;
  name: string;
  icon: string;
  is_enabled: boolean;
  balance: number;
  last_modified_time: string;
}

export interface Category {
  category_id: number;
  name: string;
  icon: string;
  parent_id: number | null;
  root_id: number;
  wallet_id: number;
  is_global: boolean;
  wallet?: Wallet;
}

export interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[] | null;
}

export interface CategoryTree {
  roots: CategoryTreeNode[];
}

export interface Person {
  person_id: number;
  person_name: string;
  alias: string;
}

export interface Transaction {
  transaction_id: number;
  category_id: number;
  amount: number;
  note: string | null;
  person_id: number | null;
  wallet_id: number;
  transaction_time: string;
  entry_time: string;
  last_modified_time: string;
  user_id: number;
  category?: Category;
  person?: Person;
  wallet?: Wallet;
  user?: User;
}

export interface InitStatus {
  success: boolean;
  message: string;
  init_done: boolean;
  is_new_db: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

// API Functions
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

// Init
export async function checkInitStatus(): Promise<InitStatus> {
  const response = await fetch(`${API_BASE}/initdone`);
  return response.json();
}

export async function initDatabase(params: {
  force_migrate: boolean;
  default_wallet_name: string;
  admin_username: string;
  admin_password: string;
  admin_email: string;
  admin_name: string;
}): Promise<ApiResponse<any>> {
  return apiRequest("/init", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// Users
export async function getUsers(): Promise<ApiResponse<User[]>> {
  return apiRequest("/users");
}

export async function createUser(params: {
  username: string;
  name: string;
  email: string;
  password: string;
  user_type: string;
  wallet_name: string;
  wallet_group_name: string;
  create_categories: boolean;
}): Promise<ApiResponse<{ user: User; wallet: Wallet }>> {
  return apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getUserWallets(userId: number): Promise<ApiResponse<Wallet[]>> {
  return apiRequest(`/users/${userId}/wallets`);
}

// Wallets
export async function getWallets(): Promise<ApiResponse<Wallet[]>> {
  return apiRequest("/wallets");
}

export async function getWallet(walletId: number): Promise<ApiResponse<Wallet>> {
  return apiRequest(`/wallets/${walletId}`);
}

export async function createWallet(params: {
  name: string;
  icon: string;
  is_enabled: boolean;
  balance: number;
}): Promise<ApiResponse<Wallet>> {
  return apiRequest("/wallets", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function updateWallet(
  walletId: number,
  params: Partial<{
    name: string;
    icon: string;
    is_enabled: boolean;
    balance: number;
  }>
): Promise<ApiResponse<Wallet>> {
  return apiRequest(`/wallets/${walletId}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export async function deleteWallet(walletId: number): Promise<ApiResponse<void>> {
  return apiRequest(`/wallets/${walletId}`, { method: "DELETE" });
}

// Categories
export async function getCategories(walletId: number): Promise<ApiResponse<Category[]>> {
  return apiRequest(`/wallets/${walletId}/categories`);
}

export async function getCategoryTree(walletId: number): Promise<ApiResponse<CategoryTree>> {
  return apiRequest(`/wallets/${walletId}/categories/tree`);
}

export async function createCategory(
  walletId: number,
  params: {
    name: string;
    icon: string;
    parent_id: number | null;
    is_global: boolean;
  }
): Promise<ApiResponse<Category>> {
  return apiRequest(`/wallets/${walletId}/categories`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function updateCategory(
  walletId: number,
  categoryId: number,
  params: Partial<{
    name: string;
    icon: string;
    is_global: boolean;
    parent_id: number | null;
  }>
): Promise<ApiResponse<Category>> {
  return apiRequest(`/wallets/${walletId}/categories/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export async function deleteCategory(
  walletId: number,
  categoryId: number
): Promise<ApiResponse<void>> {
  return apiRequest(`/wallets/${walletId}/categories/${categoryId}`, {
    method: "DELETE",
  });
}

// Transactions
export interface TransactionFilters {
  wallet_id?: number;
  user_id?: number;
  category_ids?: number[];
  person_id?: number;
  start_transaction_time?: string;
  end_transaction_time?: string;
  start_entry_time?: string;
  end_entry_time?: string;
  start_last_modified_time?: string;
  end_last_modified_time?: string;
  amount_op?: "eq" | "gt" | "lt" | "ge" | "le";
  amount_value?: number;
  fuzzy_note?: string;
}

function buildQueryString(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.wallet_id) params.append("wallet_id", filters.wallet_id.toString());
  if (filters.user_id) params.append("user_id", filters.user_id.toString());
  if (filters.category_ids?.length)
    params.append("category_ids", filters.category_ids.join(","));
  if (filters.person_id) params.append("person_id", filters.person_id.toString());
  if (filters.start_transaction_time)
    params.append("start_transaction_time", filters.start_transaction_time);
  if (filters.end_transaction_time)
    params.append("end_transaction_time", filters.end_transaction_time);
  if (filters.start_entry_time)
    params.append("start_entry_time", filters.start_entry_time);
  if (filters.end_entry_time)
    params.append("end_entry_time", filters.end_entry_time);
  if (filters.start_last_modified_time)
    params.append("start_last_modified_time", filters.start_last_modified_time);
  if (filters.end_last_modified_time)
    params.append("end_last_modified_time", filters.end_last_modified_time);
  if (filters.amount_op) params.append("amount_op", filters.amount_op);
  if (filters.amount_value !== undefined)
    params.append("amount_value", filters.amount_value.toString());
  if (filters.fuzzy_note) params.append("fuzzy_note", filters.fuzzy_note);
  return params.toString();
}

export async function getTransactions(
  filters?: TransactionFilters
): Promise<ApiResponse<Transaction[]>> {
  const query = filters ? `?${buildQueryString(filters)}` : "";
  return apiRequest(`/transactions${query}`);
}

export async function getWalletTransactions(
  walletId: number,
  filters?: Omit<TransactionFilters, "wallet_id">
): Promise<ApiResponse<Transaction[]>> {
  const query = filters ? `?${buildQueryString(filters)}` : "";
  return apiRequest(`/wallets/${walletId}/transactions${query}`);
}

export async function createTransaction(params: {
  wallet_id: number;
  category_id: number;
  amount: number;
  person_name?: string;
  note?: string;
  user_id: number;
  transaction_time?: string;
}): Promise<ApiResponse<Transaction>> {
  return apiRequest("/transactions", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function updateTransaction(
  transactionId: number,
  params: Partial<{
    category_id: number;
    amount: number;
    note: string;
    person_name: string;
    transaction_time: string;
  }>
): Promise<ApiResponse<Transaction>> {
  return apiRequest(`/transactions/${transactionId}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export async function deleteTransaction(
  transactionId: number
): Promise<ApiResponse<void>> {
  return apiRequest(`/transactions/${transactionId}`, { method: "DELETE" });
}

// Persons
export async function getPersons(): Promise<ApiResponse<Person[]>> {
  return apiRequest("/persons");
}

export async function createPerson(params: {
  person_name: string;
  alias?: string;
}): Promise<ApiResponse<Person>> {
  return apiRequest("/persons", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function updatePerson(
  personId: number,
  params: Partial<{ person_name: string; alias: string }>
): Promise<ApiResponse<Person>> {
  return apiRequest(`/persons/${personId}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export async function deletePerson(personId: number): Promise<ApiResponse<void>> {
  return apiRequest(`/persons/${personId}`, { method: "DELETE" });
}
